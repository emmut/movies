import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { expect, test } from '@playwright/test';

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

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/discovery/options*', async (route) => {
    if (await preflight(route)) return;
    await route.fulfill({ json: { json: choices }, headers: corsHeaders });
  });
  await page.route('**/rpc/discovery/list*', async (route) => {
    if (await preflight(route)) return;
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
    if (await preflight(route)) return;
    await route.fulfill({ json: { json: detailFixture('movie') }, headers: corsHeaders });
  });
});

test('discovery stays native through detail navigation and browser back', async ({ page }) => {
  await page.goto('/discover?genreId=12');
  await expect(page.getByRole('link', { name: 'Open Discovered movie, Movie' })).toBeVisible();
  await page.getByRole('link', { name: 'Open Discovered movie, Movie' }).click();
  await expect(page).toHaveURL(/\/discover\/movie\/42$/);
  await expect(page.getByText('A memorable story.', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/discover\?genreId=12$/);
  await expect(page.getByRole('link', { name: 'Open Discovered movie, Movie' })).toBeVisible();
  expect(page.context().pages()).toHaveLength(1);
});

test('filter sheets preserve OR selections and reset pagination', async ({ page }) => {
  const inputs: Record<string, unknown>[] = [];
  await page.route('**/rpc/discovery/list*', async (route) => {
    if (await preflight(route)) return;
    inputs.push(readInput(route.request()));
    await route.fulfill({
      json: { json: { items: [], totalPages: 3, totalResults: 50 } },
      headers: corsHeaders,
    });
  });
  await page.goto('/discover?page=2');
  await page.getByRole('button', { name: 'Genres', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Adventure', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Action', exact: true }).click();
  await page.getByRole('button', { name: 'Close Genres' }).click();
  await expect.poll(() => inputs.at(-1)).toMatchObject({ page: 1, genreIds: [12, 28] });

  await page.getByRole('button', { name: 'Watch Providers', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Netflix', exact: true }).click();
  await page.getByRole('button', { name: 'Close Watch Providers' }).click();
  await page.getByRole('button', { name: 'Origin Country', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Sweden', exact: true }).click();
  await page.getByRole('button', { name: 'Close Origin Country' }).click();
  await page.getByRole('button', { name: 'Runtime', exact: true }).click();
  await page.getByRole('radio', { name: 'Up to 90 min', exact: true }).click();
  await page.getByRole('button', { name: 'Sort By', exact: true }).click();
  await page.getByRole('radio', { name: 'Rating (High to Low)', exact: true }).click();
  await expect
    .poll(() => inputs.at(-1))
    .toMatchObject({
      providerIds: [8],
      originCountries: ['SE'],
      runtime: 90,
      sortBy: 'vote_average.desc',
    });
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
    if (await preflight(route)) return;
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
  await page.getByRole('button', { name: 'Watch Region', exact: true }).click();
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
    if (await preflight(route)) return;
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
    if (await preflight(route)) return;
    attempts += 1;
    if (attempts <= 2) return route.fulfill({ status: 500, headers: corsHeaders, body: 'offline' });
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
