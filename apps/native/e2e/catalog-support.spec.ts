import { expect, test } from '@playwright/test';

import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from './catalog-fixtures';

const provider = { id: 8, name: 'Test Streaming', logoUrl: null };
const groups = {
  link: 'https://watch.example/title/42',
  free: [],
  streaming: [provider],
  rent: [{ ...provider, id: 9, name: 'Test Rent' }],
  buy: [{ ...provider, id: 10, name: 'Test Buy' }],
};
const related = {
  id: 43,
  type: 'movie',
  title: 'Another movie',
  releaseDate: '2025',
  posterUrl: null,
  backdropUrl: null,
  rating: 7.31,
};

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) return;
    await route.fulfill({ json: { json: [] }, headers: corsHeaders });
  });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) return;
    const input = readInput(route.request());
    const item = detailFixture(input.type);
    if (input.id === 43) {
      item.id = 43;
      item.title = 'Another movie';
    }
    await route.fulfill({ json: { json: item }, headers: corsHeaders });
  });
});

for (const type of ['movie', 'tv'] as const) {
  test(`${type} trailer opens a sheet, embeds the chosen video and unmounts on close`, async ({
    page,
  }) => {
    await page.route('**/rpc/catalog/trailer*', async (route) => {
      if (await preflight(route)) return;
      expect(readInput(route.request())).toEqual({ id: 42, type });
      await route.fulfill({ json: { json: { key: 'AbCdEfGhI_1' } }, headers: corsHeaders });
    });
    await page.route('https://www.youtube.com/embed/**', (route) =>
      route.fulfill({ body: '<html><body>Trailer player</body></html>', contentType: 'text/html' }),
    );
    await page.goto(`/${type}/42`);
    const title = type === 'movie' ? 'Test movie' : 'Test series';
    await page.getByRole('button', { name: `Play Trailer for ${title}` }).click();
    const iframe = page.locator(`iframe[title="${title} - Trailer"]`);
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/AbCdEfGhI_1?autoplay=1&playsinline=1',
    );
    const bounds = await iframe.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(200);
    expect(bounds?.width).toBeGreaterThanOrEqual(200);
    expect(page.context().pages()).toHaveLength(1);
    await page.getByRole('button', { name: 'Close trailer' }).click();
    await expect(iframe).not.toBeAttached();
    await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  });
}

test('provider region changes affect availability and persist across related-title back navigation', async ({
  page,
}) => {
  const providerRegions: string[] = [];
  const relatedRegions: string[] = [];
  await page.route('**/rpc/catalog/providers*', async (route) => {
    if (await preflight(route)) return;
    const input = readInput(route.request());
    providerRegions.push(input.region);
    const result = {
      ...groups,
      streaming: [{ ...provider, name: input.region === 'US' ? 'US service' : 'Swedish service' }],
    };
    await route.fulfill({ json: { json: result }, headers: corsHeaders });
  });
  await page.route('**/rpc/catalog/related*', async (route) => {
    if (await preflight(route)) return;
    const input = readInput(route.request());
    relatedRegions.push(input.region);
    await route.fulfill({
      json: { json: input.id === 42 && input.kind === 'recommendations' ? [related] : [] },
      headers: corsHeaders,
    });
  });
  await page.goto('/movie/42');
  await page.getByRole('button', { name: 'Watch region: Sweden. Change region' }).click();
  await page.getByRole('radio', { name: 'United States', exact: true }).click();
  await expect(page).toHaveURL(/watchRegion=US/);
  await expect(page.getByRole('link', { name: 'US service (opens browser)' })).toBeAttached();
  await expect(
    page.getByRole('link', { name: 'Swedish service (opens browser)' }),
  ).not.toBeAttached();
  expect(providerRegions).toContain('US');
  const card = page.getByRole('link', { name: 'Open Another movie, Movie' });
  await card.scrollIntoViewIfNeeded();
  const offset = await page.getByTestId('catalog-scroll').evaluate((element) => element.scrollTop);
  await card.click();
  await expect(page).toHaveURL(/\/movie\/43$/);
  await expect(page.getByText('Another movie', { exact: true }).last()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/movie\/42\?watchRegion=US$/);
  await expect(
    page.getByRole('button', { name: 'Watch region: United States. Change region' }),
  ).toBeAttached();
  await expect
    .poll(() => page.getByTestId('catalog-scroll').evaluate((element) => element.scrollTop))
    .toBe(offset);
  expect(new Set(relatedRegions)).toEqual(new Set(['SE']));
});

test('provider groups link to the selected watch URL and retain artwork/name contrast', async ({
  page,
}) => {
  await page.route('**/rpc/catalog/providers*', async (route) => {
    if (await preflight(route)) return;
    await route.fulfill({
      json: { json: { ...groups, free: [{ ...provider, id: 11, name: 'Free service' }] } },
      headers: corsHeaders,
    });
  });
  await page
    .context()
    .route('https://watch.example/**', (route) => route.fulfill({ body: 'Provider page' }));
  await page.goto('/tv/42');
  for (const heading of ['Free', 'Streaming', 'Rent', 'Buy']) {
    await expect(page.getByText(heading, { exact: true })).toBeAttached();
  }
  const service = page.getByRole('link', { name: 'Test Streaming (opens browser)' });
  await service.scrollIntoViewIfNeeded();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(service.getByText('Test Streaming')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(service.getByText('Test Streaming')).toHaveCSS('color', 'rgb(255, 255, 255)');
  const popup = page.waitForEvent('popup');
  await service.click();
  await expect(await popup).toHaveURL(groups.link);
});

test('free-only availability is not labelled unavailable, and absent trailers/related rows stay hidden', async ({
  page,
}) => {
  await page.route('**/rpc/catalog/providers*', async (route) => {
    if (await preflight(route)) return;
    await route.fulfill({
      json: { json: { link: groups.link, free: [provider], streaming: [], rent: [], buy: [] } },
      headers: corsHeaders,
    });
  });
  await page.goto('/movie/42');
  await expect(page.getByText('Free', { exact: true })).toBeAttached();
  await expect(page.getByText('No services available for this region')).not.toBeAttached();
  await expect(page.getByRole('button', { name: /Play Trailer/ })).not.toBeAttached();
  await expect(page.getByText('Similar Movies', { exact: true })).not.toBeAttached();
  await expect(page.getByText('Recommendations', { exact: true })).not.toBeAttached();
});

test('supporting outages retry independently without discarding core details', async ({ page }) => {
  let failed = true;
  await page.route(/\/rpc\/catalog\/(trailer|providers|related)(?:\?|$)/, async (route) => {
    if (await preflight(route)) return;
    if (!failed) {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = [];
      if (path.endsWith('/trailer')) data = { key: 'AbCdEfGhI_1' };
      if (path.endsWith('/providers')) data = { ...groups, streaming: [] };
      await route.fulfill({ json: { json: data }, headers: corsHeaders });
      return;
    }
    await route.fulfill({
      status: 500,
      json: {
        json: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          status: 500,
          defined: false,
        },
      },
      headers: corsHeaders,
    });
  });
  await page.goto('/movie/42');
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  await expect(page.getByRole('button', { name: 'Retry trailer' })).toBeAttached();
  await expect(page.getByRole('button', { name: 'Retry watch providers' })).toBeAttached();
  await expect(page.getByRole('button', { name: 'Retry Similar Movies' })).toBeAttached();
  await expect(page.getByRole('button', { name: 'Retry Recommendations' })).toBeAttached();
  failed = false;
  await page.getByRole('button', { name: 'Retry watch providers' }).click();
  await expect(page.getByRole('link', { name: 'Test Rent (opens browser)' })).toBeAttached();
  await expect(page.getByRole('button', { name: 'Retry trailer' })).toBeAttached();
  await page.getByRole('button', { name: 'Retry trailer' }).click();
  await expect(page.getByRole('button', { name: /Play Trailer/ })).toBeAttached();
  await page.getByRole('button', { name: 'Retry Recommendations' }).click();
  await expect(page.getByText('Recommendations', { exact: true })).not.toBeAttached();
});

test('supporting requests can remain pending while core metadata is usable', async ({ page }) => {
  const completion = Promise.withResolvers<void>();
  await page.route(/\/rpc\/catalog\/(trailer|providers|related)(?:\?|$)/, async (route) => {
    if (await preflight(route)) return;
    await completion.promise;
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path.endsWith('/trailer')) data = null;
    if (path.endsWith('/providers'))
      data = { link: groups.link, free: [], streaming: [], rent: [], buy: [] };
    await route.fulfill({ json: { json: data }, headers: corsHeaders });
  });
  await page.goto('/movie/42');
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  await expect(page.getByLabel('Loading trailer')).toBeAttached();
  await expect(page.getByLabel('Loading watch providers')).toBeAttached();
  completion.resolve();
  await expect(page.getByText('No services available for this region')).toBeAttached();
});
