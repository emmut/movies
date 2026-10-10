import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { expect, test } from '@playwright/test';

test.beforeEach(mockEmptySupport);

for (const type of ['movie', 'tv'] as const) {
  test(`${type} deep links render metadata and preserve theme contrast`, async ({ page }) => {
    await page.route('**/rpc/catalog/details*', async (route) => {
      if (await preflight(route)) return;
      expect(readInput(route.request())).toEqual({ id: 42, type, region: 'SE' });
      await route.fulfill({ json: { json: detailFixture(type) }, headers: corsHeaders });
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/${type}/42`);
    await expect(page.getByText('No Poster', { exact: true })).toBeVisible();
    await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
    await expect(page.getByText('Rated R (US)', { exact: true })).toBeAttached();
    await expect(page.getByText('8.3', { exact: true })).toBeAttached();
    await expect(page.getByText('1,200 votes', { exact: true })).toBeAttached();
    if (type === 'movie') {
      await expect(page.getByText('2h 5m', { exact: true })).toBeAttached();
      await expect(page.getByText('Budget', { exact: true })).toBeAttached();
    } else {
      await expect(page.getByText('Seasons', { exact: true })).toHaveCount(2);
      await expect(page.getByText('A network', { exact: true })).toBeAttached();
      await expect(page.getByText('Episodes', { exact: true })).toBeAttached();
    }
    await page.getByText('Overview', { exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByText('A memorable story.', { exact: true })).toBeVisible();
    const score = page.getByText('8.3', { exact: true });
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(score).toHaveCSS('color', 'rgb(255, 255, 255)');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(score).toHaveCSS('color', 'rgb(255, 255, 255)');
    expect(errors).toEqual([]);
  });
}

test('missing optional data uses honest fallbacks without inert actions', async ({ page }) => {
  const item = {
    ...detailFixture('movie'),
    overview: '',
    tagline: '',
    genres: [],
    certification: null,
    homepage: null,
    releaseDate: '',
    runtime: null,
    budget: 0,
    revenue: 0,
  };
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) return;
    await route.fulfill({ json: { json: item }, headers: corsHeaders });
  });
  await page.goto('/movie/42');
  await expect(page.getByText('No Poster', { exact: true })).toBeVisible();
  await expect(page.getByText('No overview available for this movie.')).toBeAttached();
  await expect(page.getByText('N/A', { exact: true })).toBeAttached();
  await expect(page.getByText('Genres', { exact: true })).not.toBeAttached();
  await expect(page.getByText('Runtime', { exact: true })).not.toBeAttached();
  await expect(page.getByText('Budget', { exact: true })).not.toBeAttached();
  await expect(page.getByText('Profit', { exact: true })).not.toBeAttached();
  await expect(
    page.getByRole('link', { name: 'Official website (opens browser)' }),
  ).not.toBeAttached();
});

test('shows loading, distinguishes outage from not found, and retries', async ({ page }) => {
  let state: 'outage' | 'ready' | 'missing' = 'outage';
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) return;
    await route.fulfill({
      status: state === 'ready' ? 200 : state === 'missing' ? 404 : 500,
      headers: corsHeaders,
      json:
        state === 'ready'
          ? { json: detailFixture('movie') }
          : {
              json: {
                code: state === 'missing' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
                message: state === 'missing' ? 'Title not found' : 'Internal server error',
                status: state === 'missing' ? 404 : 500,
                defined: state === 'missing',
              },
            },
    });
  });
  await page.goto('/movie/42');
  await expect(page.getByText('Couldn’t load this title.', { exact: true })).toBeVisible();
  state = 'ready';
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  state = 'missing';
  await page.reload();
  await expect(page.getByText('Title not found', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).not.toBeAttached();
  await expect(page.getByRole('button', { name: 'Go to Home' })).toBeVisible();
});

test('invalid route IDs do not fetch catalog data', async ({ page }) => {
  let requests = 0;
  await page.route('**/rpc/catalog/details*', async (route) => {
    requests += 1;
    await route.abort();
  });
  for (const route of ['/movie/0', '/tv/1e2', '/movie/not-a-number', '/person/42']) {
    await page.goto(route);
    await expect(page.getByText('Title not found', { exact: true })).toBeVisible();
  }
  expect(requests).toBe(0);
});

test('shows loading while details are in flight', async ({ page }) => {
  const response = Promise.withResolvers<void>();
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) return;
    await response.promise;
    await route.fulfill({ json: { json: detailFixture('movie') }, headers: corsHeaders });
  });
  await page.goto('/movie/42');
  await expect(page.getByText('Loading title…', { exact: true })).toBeVisible();
  response.resolve();
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
});
