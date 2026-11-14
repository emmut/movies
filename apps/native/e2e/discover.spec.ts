import { originCountries as knownCountries } from '@movies/config/countries';
import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { expect, test, type Page } from '@playwright/test';

async function openFilterMenu(page: Page) {
  await page.getByRole('button', { name: /^Filters(?: \(\d+\))?$/ }).click();
}

async function openFilter(page: Page, name: string) {
  await openFilterMenu(page);
  await page.getByRole('button', { name, exact: true }).click();
}

const choices = {
  genres: [
    { id: 12, name: 'Adventure' },
    { id: 28, name: 'Action' },
  ],
  providers: [
    { id: 8, name: 'Netflix', logoUrl: null },
    { id: 9, name: 'Other service', logoUrl: null },
  ],
  countries: [
    { code: 'SE', name: 'Sweden' },
    { code: 'US', name: 'United States' },
  ],
};
const card = {
  id: 42,
  type: 'movie',
  title: 'Discovered movie',
  releaseDate: '2026-01-01',
  posterUrl: null,
  backdropUrl: null,
  rating: 8.2,
};

for (const code of ['AUTH_NOT_CONFIGURED', 'INTERNAL_SERVER_ERROR']) {
  test(
    'discovery distinguishes unconfigured auth from session failure: ' + code,
    async ({ page }) => {
      await page.route('**/api/auth/get-session*', async (route) => {
        if (await preflight(route)) {
          return;
        }
        await route.fulfill({
          status: 503,
          json: { code, message: 'Authentication unavailable' },
          headers: corsHeaders,
        });
      });
      await page.goto('/discover');
      if (code === 'AUTH_NOT_CONFIGURED') {
        await expect(
          page.getByRole('link', { name: 'Open Discovered movie, Movie' }),
        ).toBeVisible();
        await expect(page.getByText('Couldn’t load account preferences.')).not.toBeAttached();
      } else {
        await expect(page.getByText('Couldn’t load account preferences.')).toBeVisible();
        await expect(
          page.getByRole('link', { name: 'Open Discovered movie, Movie' }),
        ).not.toBeAttached();
      }
    },
  );
}

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/discovery/options*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: choices }, headers: corsHeaders });
  });
  await page.route('**/rpc/discovery/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    await route.fulfill({
      json: {
        json: {
          items: [
            {
              ...card,
              type: input.type,
              title: input.type === 'tv' ? 'Discovered series' : card.title,
            },
          ],
          totalPages: 3,
          totalResults: 50,
        },
      },
      headers: corsHeaders,
    });
  });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: detailFixture('movie') }, headers: corsHeaders });
  });
});

test('discovery stays native through detail navigation and browser back', async ({ page }) => {
  await page.goto('/discover?genreId=12');
  await expect(page.getByRole('link', { name: 'Open Discovered movie, Movie' })).toBeVisible();
  await page.getByRole('link', { name: 'Open Discovered movie, Movie' }).click();
  await expect(page).toHaveURL(/\/discover\/movie\/42\?region=SE$/);
  await expect(page.getByText('A memorable story.', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/discover\?genreId=12$/);
  await expect(page.getByRole('link', { name: 'Open Discovered movie, Movie' })).toBeVisible();
  expect(page.context().pages()).toHaveLength(1);
});

test('filter sheets preserve OR selections and reset pagination', async ({ page }) => {
  const inputs: Record<string, unknown>[] = [];
  await page.route('**/rpc/discovery/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    inputs.push(readInput(route.request()));
    await route.fulfill({
      json: { json: { items: [], totalPages: 3, totalResults: 50 } },
      headers: corsHeaders,
    });
  });
  await page.goto('/discover?page=2');
  await openFilter(page, 'Genres');
  await page.getByRole('checkbox', { name: 'Adventure', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Action', exact: true }).click();
  await page.getByRole('button', { name: 'Close Genres' }).click();
  await expect.poll(() => inputs.at(-1)).toMatchObject({ page: 1, genreIds: [12, 28] });

  await openFilter(page, 'Watch Providers');
  await page.getByRole('checkbox', { name: 'Netflix', exact: true }).click();
  await page.getByRole('button', { name: 'Close Watch Providers' }).click();
  await openFilter(page, 'Origin Country');
  await page.getByRole('checkbox', { name: 'Sweden', exact: true }).click();
  await page.getByRole('button', { name: 'Close Origin Country' }).click();
  await openFilter(page, 'Runtime');
  await page.getByRole('radio', { name: 'Up to 90 min', exact: true }).click();
  await openFilter(page, 'Sort By');
  await page.getByRole('radio', { name: 'Rating (High to Low)', exact: true }).click();
  await expect
    .poll(() => inputs.at(-1))
    .toMatchObject({
      providerIds: [8],
      originCountries: ['SE'],
      runtime: 90,
      sortBy: 'vote_average.desc',
    });
  await openFilterMenu(page);
  await page.getByRole('button', { name: 'Clear all filters', exact: true }).click();
  await expect
    .poll(() => inputs.at(-1))
    .toMatchObject({
      page: 1,
      genreIds: [],
      providerIds: [],
      originCountries: [],
      sortBy: 'popularity.desc',
      region: 'SE',
    });
  expect(inputs.at(-1)).not.toHaveProperty('runtime');
});

test('media type, region and page controls change the API request natively', async ({ page }) => {
  const inputs: Record<string, unknown>[] = [];
  await page.route('**/rpc/discovery/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    inputs.push(readInput(route.request()));
    await route.fulfill({
      json: {
        json: {
          items: [{ ...card, type: readInput(route.request()).type }],
          totalPages: 3,
          totalResults: 50,
        },
      },
      headers: corsHeaders,
    });
  });
  await page.goto('/discover');
  await page.getByRole('button', { name: 'TV Shows', exact: true }).click();
  await expect.poll(() => inputs.at(-1)).toMatchObject({ type: 'tv', page: 1 });
  await openFilter(page, 'Watch Region');
  await page.getByRole('radio', { name: 'United States', exact: true }).click();
  await expect.poll(() => inputs.at(-1)).toMatchObject({ region: 'US' });
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect.poll(() => inputs.at(-1)).toMatchObject({ page: 2, type: 'tv', region: 'US' });
  await page.getByRole('button', { name: 'Previous page', exact: true }).click();
  await expect(page).toHaveURL(/page=1/);
  await expect(page.getByText('50 results · Page 1 of 3')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous page', exact: true })).toBeDisabled();
  expect(page.context().pages()).toHaveLength(1);
});

test('missing results and terminal pages show usable empty and pagination states', async ({
  page,
}) => {
  await page.route('**/rpc/discovery/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: { json: { items: [], totalPages: 0, totalResults: 0 } },
      headers: corsHeaders,
    });
  });
  await page.goto('/discover');
  await expect(page.getByText('No titles match these filters.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Previous page', exact: true })).toBeDisabled();
});

test('API failures retry without handing discovery to a browser', async ({ page }) => {
  let attempts = 0;
  await page.route('**/rpc/discovery/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    attempts += 1;
    if (attempts <= 2) {
      return route.fulfill({ status: 500, headers: corsHeaders, body: 'offline' });
    }
    await route.fulfill({
      json: { json: { items: [card], totalPages: 1, totalResults: 1 } },
      headers: corsHeaders,
    });
  });
  await page.goto('/discover');
  await expect(page.getByText('Couldn’t load discovered titles.')).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open Discovered movie, Movie' })).toBeVisible();
  expect(page.context().pages()).toHaveLength(1);
});

test('genre links on existing title pages open native discovery', async ({ page }) => {
  await page.goto('/movie/42');
  await page.getByRole('link', { name: 'Discover Adventure', exact: true }).click();
  await expect(page).toHaveURL(/\/discover\?.*genreId=12/);
  await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeVisible();
  expect(page.context().pages()).toHaveLength(1);
});

test('discovery retains the shared poster treatment in dark theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/discover');
  await expect(page.getByRole('link', { name: 'Open Discovered movie, Movie' })).toBeVisible();
  await expect(page.getByText('Discovered movie', { exact: true })).toBeVisible();
  await page.getByText('Discovered movie', { exact: true }).evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  await page.screenshot({ path: '/tmp/movies-native-discover-dark.png' });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.screenshot({ path: '/tmp/movies-native-discover-light.png' });
});

test('discovery passes its selected region to title details and provider queries', async ({
  page,
}) => {
  const details: Record<string, unknown>[] = [];
  const providers: Record<string, unknown>[] = [];
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    details.push(readInput(route.request()));
    await route.fulfill({ json: { json: detailFixture('movie') }, headers: corsHeaders });
  });
  await page.route('**/rpc/catalog/providers*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    providers.push(readInput(route.request()));
    await route.fulfill({
      json: { json: { link: 'https://watch.example', free: [], streaming: [], rent: [], buy: [] } },
      headers: corsHeaders,
    });
  });
  await page.goto('/discover?watch_region=US');
  await page.getByRole('link', { name: 'Open Discovered movie, Movie' }).click();
  await expect.poll(() => details.at(-1)).toMatchObject({ region: 'US' });
  await expect.poll(() => providers.at(-1)).toMatchObject({ region: 'US' });
  await expect(
    page.getByRole('button', { name: 'Watch region: United States. Change region' }),
  ).toBeAttached();
});

test('unavailable selected providers remain visible and can be removed', async ({ page }) => {
  await page.route('**/rpc/discovery/options*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: { ...choices, providers: [] } }, headers: corsHeaders });
  });
  await page.goto('/discover?watch_region=US&with_watch_providers=8');
  await openFilterMenu(page);
  await expect(page.getByRole('button', { name: 'Watch Providers', exact: true })).toContainText(
    'Unavailable provider (8)',
  );
  await page.getByRole('button', { name: 'Watch Providers', exact: true }).click();
  const selected = page.getByRole('checkbox', { name: 'Unavailable provider (8)', exact: true });
  await expect(selected).toBeChecked();
  await selected.click();
  await expect(selected).not.toBeAttached();
  await page.getByRole('button', { name: 'Close Watch Providers' }).click();
  await openFilterMenu(page);
  await expect(page.getByRole('button', { name: 'Watch Providers', exact: true })).toContainText(
    'Any',
  );
});

test('country selection limits explain disabled additions and permit removal', async ({ page }) => {
  const countries = knownCountries
    .slice(0, 51)
    .map((code, index) => ({ code, name: 'Country ' + index }));
  await page.route('**/rpc/discovery/options*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: { ...choices, countries } }, headers: corsHeaders });
  });
  await page.goto(
    '/discover?with_origin_country=' +
      countries
        .slice(0, 50)
        .map((country) => country.code)
        .join('|'),
  );
  await openFilter(page, 'Origin Country');
  await expect(
    page.getByText('You can select up to 50 options. Remove one to select another.'),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'Find Origin Country' }).fill('Country 50');
  await expect(page.getByRole('checkbox', { name: 'Country 50', exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Find Origin Country' }).fill('Country 0');
  await page.getByRole('checkbox', { name: 'Country 0', exact: true }).click();
  await page.getByRole('textbox', { name: 'Find Origin Country' }).fill('Country 50');
  const option = page.getByRole('checkbox', { name: 'Country 50', exact: true });
  await expect(option).toBeEnabled();
  await option.click();
  await expect(option).toBeChecked();
});

for (const width of [320, 390, 430]) {
  test(`compact toolbar and evenly spaced poster grid at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.route('**/rpc/discovery/list*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      await route.fulfill({
        json: {
          json: {
            items: [
              card,
              { ...card, id: 43, title: 'Second movie' },
              { ...card, id: 44, title: 'Third movie' },
            ],
            totalPages: 1,
            totalResults: 3,
          },
        },
        headers: corsHeaders,
      });
    });
    await page.goto('/discover?genreId=12&runtime=90');
    const filters = page.getByRole('button', { name: 'Filters (2)', exact: true });
    await expect(filters).toBeVisible();
    await expect(page.getByRole('button', { name: 'Runtime', exact: true })).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Clear all filters', exact: true }),
    ).not.toBeVisible();
    const movies = (await page.getByRole('button', { name: 'Movies', exact: true }).boundingBox())!;
    expect((await filters.boundingBox())!.y).toBe(movies.y);
    const first = (await page
      .getByRole('link', { name: 'Open Discovered movie, Movie' })
      .boundingBox())!;
    const second = (await page
      .getByRole('link', { name: 'Open Second movie, Movie' })
      .boundingBox())!;
    const third = (await page
      .getByRole('link', { name: 'Open Third movie, Movie' })
      .boundingBox())!;
    expect(first.x).toBe(16);
    expect(second.x - first.x - first.width).toBeCloseTo(16, 0);
    expect(width - second.x - second.width).toBeCloseTo(16, 0);
    expect(third.y - first.y - first.height).toBeCloseTo(16, 0);
    expect(third.width).toBeCloseTo(first.width, 0);
    expect(first.height / first.width).toBeCloseTo(1.5, 1);
    expect(first.y).toBeLessThan(200);
    await page.screenshot({ path: `/tmp/native-discover-${width}.png` });
    await filters.click();
    await expect(page.getByRole('button', { name: 'Runtime', exact: true })).toContainText(
      'Up to 90 min',
    );
    await page.screenshot({ path: `/tmp/native-discover-menu-${width}.png` });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Runtime', exact: true })).not.toBeVisible();
    await expect(filters).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await filters.click();
    await page.getByRole('button', { name: 'Clear all filters', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Filters', exact: true })).toBeVisible();
  });
}
