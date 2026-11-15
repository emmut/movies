import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { expect, test, type Page } from '@playwright/test';

const names = {
  company: [
    { id: 2, name: 'Studio Pictures' },
    { id: 3, name: 'Studio Three' },
  ],
  network: [{ id: 49, name: 'HBO' }],
  keyword: [{ id: 9, name: 'space travel' }],
};

async function openFilter(page: Page, name: string) {
  await page.getByRole('button', { name: /^Filters(?: \(\d+\))?$/ }).click();
  await page.getByRole('button', { name, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/discovery/options*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      headers: corsHeaders,
      json: { json: { genres: [], providers: [], countries: [] } },
    });
  });
  await page.route('**/rpc/discovery/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      headers: corsHeaders,
      json: { json: { items: [], totalPages: 2, totalResults: 0 } },
    });
  });
  await page.route('**/rpc/discovery/facets*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request()) as {
      kind: keyof typeof names;
      query: string;
      ids: number[];
    };
    const items = names[input.kind].filter(
      (item) =>
        input.ids.includes(item.id) ||
        (input.query.length >= 2 && item.name.toLowerCase().includes(input.query.toLowerCase())),
    );
    await route.fulfill({ headers: corsHeaders, json: { json: items } });
  });
});

for (const theme of ['light', 'dark'] as const) {
  test(`company and keyword filters combine, remove and clear in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/discover?watch_region=US&page=2');
    await openFilter(page, 'Production Companies');
    await expect(page.getByText('Type at least 2 characters to search.')).toBeVisible();
    await page.getByRole('textbox', { name: 'Find Production Companies' }).fill('Studio');
    await page.getByRole('checkbox', { name: 'Studio Pictures', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Studio Three', exact: true }).click();
    await expect(page).toHaveURL(/companyId=2%7C3/);
    await page.getByRole('button', { name: 'Close Production Companies' }).click();
    await expect(page.getByRole('button', { name: 'Remove Studio Pictures' })).toBeVisible();
    await openFilter(page, 'Keywords');
    await page.getByRole('textbox', { name: 'Find Keywords' }).fill('space');
    await page.getByRole('checkbox', { name: 'space travel' }).click();
    await page.getByRole('button', { name: 'Close Keywords' }).click();
    await expect(page).toHaveURL(/keywordId=9/);
    expect(new URL(page.url()).searchParams.get('page')).toBe('1');
    expect(new URL(page.url()).searchParams.get('watch_region')).toBe('US');
    await page.screenshot({ path: `/tmp/movies-native-discover-${theme}.png` });
    await page.getByRole('button', { name: 'Remove Studio Pictures' }).click();
    await expect(page.getByRole('button', { name: 'Remove Studio Pictures' })).not.toBeAttached();
    await expect(page.getByRole('button', { name: 'Remove Studio Three' })).toBeVisible();
    await page.getByRole('button', { name: /^Filters/ }).click();
    await page.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(page.getByRole('button', { name: 'Remove Studio Three' })).not.toBeAttached();
    await expect(page.getByRole('button', { name: 'Remove space travel' })).not.toBeAttached();
  });
}

test('TV network filters load from deep links and clear on movie switching', async ({ page }) => {
  await page.goto('/discover?mediaType=tv&networkId=49&watch_region=US');
  await expect(page.getByRole('button', { name: 'Remove HBO' })).toBeVisible();
  await openFilter(page, 'Networks');
  await expect(page.getByRole('checkbox', { name: 'HBO', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Close Networks' }).click();
  await page.getByRole('button', { name: 'Movies', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove HBO' })).not.toBeAttached();
  await page.getByRole('button', { name: /^Filters/ }).click();
  await expect(page.getByRole('button', { name: 'Networks', exact: true })).not.toBeAttached();
});

test('failed searches offer retry and genuine empty results stay distinct', async ({ page }) => {
  let fail = true;
  await page.route('**/rpc/discovery/facets*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      status: fail ? 503 : 200,
      headers: corsHeaders,
      json: fail ? { message: 'offline' } : { json: [] },
    });
  });
  await page.goto('/discover');
  await openFilter(page, 'Production Companies');
  const failedSearch = page.waitForResponse(
    (response) =>
      response.url().includes('/rpc/discovery/facets') &&
      response.status() === 503 &&
      readInput(response.request()).query === 'missing',
  );
  await page.getByRole('textbox', { name: 'Find Production Companies' }).fill('missing');
  await failedSearch;
  await expect(
    page.getByRole('button', { name: 'Couldn’t load options. Try again.' }),
  ).toBeVisible();
  await expect(page.getByText('No matching options.')).not.toBeAttached();
  fail = false;
  await page.getByRole('button', { name: 'Couldn’t load options. Try again.' }).click();
  await expect(page.getByText('No matching options.')).toBeVisible();
});

test('title company and network actions preserve media and watch region into native Discover', async ({
  page,
}) => {
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ headers: corsHeaders, json: { json: detailFixture('tv') } });
  });
  await page.route('**/rpc/catalog/extras*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      headers: corsHeaders,
      json: {
        json: {
          companies: names.company,
          networks: names.network,
          collection: null,
          images: [],
          videos: [],
          keywords: [],
          releases: [],
          seasons: [],
          next: null,
          latest: null,
        },
      },
    });
  });
  await page.goto('/tv/42?region=US');
  await page.getByRole('link', { name: 'Discover HBO', exact: true }).click();
  await expect(page).toHaveURL(/\/discover\?/);
  let url = new URL(page.url());
  expect(url.searchParams.get('networkId')).toBe('49');
  expect(url.searchParams.get('watch_region')).toBe('US');
  expect(url.searchParams.get('mediaType')).toBe('tv');
  await expect(page.getByRole('button', { name: 'Remove HBO' })).toBeVisible();
  await page.goBack();
  await page.getByRole('link', { name: 'Discover Studio Pictures', exact: true }).click();
  await expect(page).toHaveURL(/companyId=2/);
  url = new URL(page.url());
  expect(url.searchParams.get('watch_region')).toBe('US');
  expect(url.searchParams.get('mediaType')).toBe('tv');
});
