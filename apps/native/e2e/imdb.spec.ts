import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { textContrastRatios } from '@native/e2e/contrast';
import { expect, test } from '@playwright/test';

const imdb = {
  url: 'https://www.imdb.com/title/tt0816692/',
  rating: { rating: 8.7, numVotes: 2400000 },
  ratingUnavailable: false,
};

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    const item = detailFixture(input.type);
    if (input.id === 43) {
      item.id = 43;
      item.title = 'Another title';
      item.rating = 7.2;
    }
    await route.fulfill({ json: { json: item }, headers: corsHeaders });
  });
});

for (const type of ['movie', 'tv']) {
  test(`${type} combines IMDb/TMDB scores and opens the title source`, async ({
    page,
    context,
  }) => {
    await page.route('**/rpc/catalog/imdb*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      expect(readInput(route.request())).toEqual({ id: 42, type });
      await route.fulfill({ json: { json: imdb }, headers: corsHeaders });
    });
    await context.route(imdb.url, (route) =>
      route.fulfill({ body: '<html><body>IMDb title</body></html>', contentType: 'text/html' }),
    );
    await page.goto(`/${type}/42`);
    const scroll = page.getByTestId('catalog-scroll');
    const rating = scroll.getByTestId('stat-TMDB / IMDb');
    await expect(rating.getByText('8.3 / 8.7', { exact: true })).toBeAttached();
    await expect(rating.getByText('1.2K / 2.4M votes', { exact: true })).toBeAttached();
    await expect(scroll.getByTestId('stat-TMDB Rating')).not.toBeAttached();
    const link = scroll.getByRole('link', { name: 'IMDb (opens browser)', exact: true });
    await link.scrollIntoViewIfNeeded();
    const source = context.waitForEvent('page');
    await link.click();
    const popup = await source;
    await expect(popup).toHaveURL(imdb.url);
    await popup.close();
  });
}

test('a missing ingested rating keeps the IMDb link and the original TMDB card', async ({
  page,
}) => {
  await page.route('**/rpc/catalog/imdb*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: { ...imdb, rating: null } }, headers: corsHeaders });
  });
  await page.goto('/movie/42');
  const scroll = page.getByTestId('catalog-scroll');
  await expect(
    scroll.getByTestId('stat-TMDB Rating').getByText('1,200 votes', { exact: true }),
  ).toBeAttached();
  await expect(scroll.getByTestId('stat-TMDB / IMDb')).not.toBeAttached();
  await expect(
    scroll.getByRole('link', { name: 'IMDb (opens browser)', exact: true }),
  ).toBeAttached();
  await expect(page.getByRole('button', { name: 'Retry IMDb rating' })).not.toBeAttached();
});

test('missing IMDb mapping omits the source without inventing a rating', async ({ page }) => {
  let calls = 0;
  await page.route('**/rpc/catalog/imdb*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    calls += 1;
    await route.fulfill({
      json: { json: { url: null, rating: null, ratingUnavailable: false } },
      headers: corsHeaders,
    });
  });
  await page.goto('/tv/42');
  await expect.poll(() => calls).toBe(1);
  const scroll = page.getByTestId('catalog-scroll');
  await expect(scroll.getByTestId('stat-TMDB Rating')).toBeAttached();
  await expect(
    scroll.getByRole('link', { name: 'IMDb (opens browser)', exact: true }),
  ).not.toBeAttached();
});

test('rating-store failure keeps core data/source usable and retries independently', async ({
  page,
}) => {
  let fail = true;
  let release = function release() {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  let detailRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/rpc/catalog/details') && request.method() === 'POST') {
      detailRequests += 1;
    }
  });
  await page.route('**/rpc/catalog/imdb*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    if (!fail) {
      await ready;
    }
    await route.fulfill({
      json: { json: fail ? { ...imdb, rating: null, ratingUnavailable: true } : imdb },
      headers: corsHeaders,
    });
  });
  await page.goto('/movie/42');
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  await expect(
    page.getByRole('link', { name: 'IMDb (opens browser)', exact: true }),
  ).toBeAttached();
  const retry = page.getByRole('button', { name: 'Retry IMDb rating' });
  await retry.scrollIntoViewIfNeeded();
  fail = false;
  await retry.click();
  await expect(page.getByLabel('Loading IMDb rating')).toBeAttached();
  await expect(retry).not.toBeAttached();
  release();
  await expect(page.getByTestId('stat-TMDB / IMDb')).toBeAttached();
  expect(detailRequests).toBe(1);
});

test('upstream mapping outages have retry while the title remains readable', async ({ page }) => {
  let fail = true;
  await page.route('**/rpc/catalog/imdb*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    if (fail) {
      await route.fulfill({
        status: 500,
        json: { message: 'Internal server error' },
        headers: corsHeaders,
      });
      return;
    }
    await route.fulfill({ json: { json: imdb }, headers: corsHeaders });
  });
  await page.goto('/movie/42');
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  const retry = page.getByRole('button', { name: 'Retry IMDb rating' });
  await retry.scrollIntoViewIfNeeded();
  fail = false;
  await retry.click();
  await expect(page.getByTestId('stat-TMDB / IMDb')).toBeAttached();
  await expect(retry).not.toBeAttached();
});

test('slow IMDb reads do not block TMDB metadata or overview', async ({ page }) => {
  let release = function release() {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/rpc/catalog/imdb*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await ready;
    await route.fulfill({ json: { json: imdb }, headers: corsHeaders });
  });
  await page.goto('/movie/42');
  await expect(page.getByTestId('stat-TMDB Rating')).toBeAttached();
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  release();
  await expect(page.getByTestId('stat-TMDB / IMDb')).toBeAttached();
});

test('related-title navigation never displays the preceding title’s IMDb rating', async ({
  page,
}) => {
  let release = function release() {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/rpc/catalog/imdb*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    if (input.id === 43) {
      await ready;
    }
    const result =
      input.id === 43
        ? {
            ...imdb,
            url: 'https://www.imdb.com/title/tt0944947/',
            rating: { rating: 9.1, numVotes: 1000 },
          }
        : imdb;
    await route.fulfill({ json: { json: result }, headers: corsHeaders });
  });
  await page.route('**/rpc/catalog/related*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    await route.fulfill({
      json: {
        json:
          input.id === 42 && input.kind === 'recommendations'
            ? [
                {
                  id: 43,
                  type: 'movie',
                  title: 'Another title',
                  releaseDate: '2025',
                  posterUrl: null,
                  backdropUrl: null,
                  rating: 7.2,
                },
              ]
            : [],
      },
      headers: corsHeaders,
    });
  });
  await page.goto('/movie/42');
  await expect(page.getByText('8.3 / 8.7', { exact: true })).toBeAttached();
  const link = page.getByRole('link', { name: 'Open Another title, Movie', exact: true });
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(
    page.getByTestId('stat-TMDB Rating').getByText('7.2', { exact: true }),
  ).toBeAttached();
  await expect(page.getByText('8.3 / 8.7', { exact: true })).not.toBeVisible();
  release();
  await expect(page.getByText('7.2 / 9.1', { exact: true })).toBeAttached();
  await page.goBack();
  await page.getByText('8.3 / 8.7', { exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByText('8.3 / 8.7', { exact: true })).toBeVisible();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`combined rating and IMDb source are readable in ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.route('**/rpc/catalog/imdb*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      await route.fulfill({ json: { json: imdb }, headers: corsHeaders });
    });
    await page.goto('/movie/42');
    const card = page.getByTestId('stat-TMDB / IMDb');
    await card.scrollIntoViewIfNeeded();
    for (const ratio of await textContrastRatios(card)) {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
    await page.screenshot({ path: `/tmp/pr350-native-imdb-rating-${colorScheme}.png` });
    const source = page.getByRole('link', { name: 'IMDb (opens browser)', exact: true });
    await source.scrollIntoViewIfNeeded();
    for (const ratio of await textContrastRatios(source)) {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
    await expect(source.locator('svg')).toHaveCSS('width', '16px');
    await page.screenshot({ path: `/tmp/pr350-native-imdb-source-${colorScheme}.png` });
  });
}
