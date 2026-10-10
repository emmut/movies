import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { expect, test } from '@playwright/test';

test.beforeEach(mockEmptySupport);

const title = {
  id: 42,
  type: 'movie',
  title: 'Test movie',
  releaseDate: '2026-10-10',
  posterUrl: null,
  backdropUrl: null,
  rating: 8.2,
};

function responseTitle(input: { type?: string; category?: string }) {
  const type = input.type ?? (input.category?.endsWith('movies') ? 'movie' : 'tv');
  return { ...title, type, title: type === 'movie' ? 'Test movie' : 'Test series' };
}

test('renders the homepage, changes regional queries, and opens native details', async ({
  page,
}) => {
  const regions: string[] = [];
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) return;
    const input = readInput(route.request());
    if (input.region) regions.push(input.region);
    await route.fulfill({ json: { json: [responseTitle(input)] }, headers: corsHeaders });
  });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) return;
    const input = readInput(route.request());
    expect(input).toEqual({ id: 42, type: 'movie', region: 'US' });
    await route.fulfill({ json: { json: detailFixture('movie') }, headers: corsHeaders });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('Trending Now', { exact: true })).toBeVisible();
  for (const heading of [
    'Movies in Theaters',
    'TV Shows on Air',
    'Coming Soon',
    'Popular TV Shows',
    'Top Rated Movies',
    'Top Rated TV Shows',
  ]) {
    await expect(page.getByText(heading, { exact: true })).toBeAttached();
  }
  await expect(page.getByRole('link', { name: 'Open Test movie, Movie' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Region: Sweden/ }).click();
  await page.getByRole('radio', { name: 'United States' }).click();
  await expect.poll(() => regions.filter((region) => region === 'US').length).toBe(6);
  await expect(page.getByRole('button', { name: /Region: United States/ })).toBeVisible();
  await expect(page.getByText('Choose your region', { exact: true })).not.toBeVisible();
  expect(errors).toEqual([]);
  await page.evaluate(() => {
    document.documentElement.dataset.navigationIdentity = 'same-document';
  });
  const poster = page.getByRole('link', { name: 'Open Test movie, Movie' }).nth(1);
  await poster.scrollIntoViewIfNeeded();
  const scrollTop = await page.getByTestId('home-scroll').evaluate((element) => element.scrollTop);
  expect(scrollTop).toBeGreaterThan(0);
  await poster.click();
  await expect(page).toHaveURL(/\/movie\/42$/);
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  expect(page.context().pages()).toHaveLength(1);
  await expect(page.locator('html')).toHaveAttribute('data-navigation-identity', 'same-document');
  await page.goBack();
  await expect(page.locator('html')).toHaveAttribute('data-navigation-identity', 'same-document');
  await expect(page.getByRole('button', { name: /Region: United States/ })).toBeVisible();
  await expect
    .poll(() => page.getByTestId('home-scroll').evaluate((element) => element.scrollTop))
    .toBe(scrollTop);
  await page.screenshot({ path: '/tmp/movies-native-home.png' });
});

test('shows empty rows and allows retry after an API outage', async ({ page }) => {
  let fail = true;
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) return;
    await route.fulfill({
      status: fail ? 500 : 200,
      json: fail
        ? {
            json: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Internal server error',
              status: 500,
              defined: false,
            },
          }
        : { json: [] },
      headers: { 'access-control-allow-origin': '*' },
    });
  });
  await page.goto('/');
  const retry = page.getByRole('button', { name: 'Try again' }).first();
  await expect(retry).toBeVisible();
  fail = false;
  await retry.click();
  await expect(page.getByText('No titles available right now.').first()).toBeVisible();
});

test('applies Tailwind image sizing and follows the system theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) return;
    await route.fulfill({ json: { json: [title] }, headers: corsHeaders });
  });
  await page.goto('/');
  const card = page.getByRole('link', { name: 'Open Test movie, Movie' }).first();
  await expect(card).toBeVisible();
  await expect(card.locator(':scope > div').first()).toHaveCSS('height', '208px');
  const heading = page.getByText('Trending Now', { exact: true });
  const lightColor = await heading.evaluate((element) => getComputedStyle(element).color);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect
    .poll(() => heading.evaluate((element) => getComputedStyle(element).color))
    .not.toBe(lightColor);
});

test('keeps touch metadata on the artwork with distinct movie and TV accents', async ({ page }) => {
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) return;
    const item = responseTitle(readInput(route.request()));
    await route.fulfill({
      json: { json: [{ ...item, releaseDate: '', rating: 8.21 }] },
      headers: corsHeaders,
    });
  });
  await page.goto('/');
  const movie = page.getByRole('link', { name: 'Open Test movie, Movie' }).first();
  const series = page.getByRole('link', { name: 'Open Test series, TV Show' }).first();
  await expect(movie.getByText('Test movie', { exact: true })).toBeVisible();
  await expect(movie.getByText('Release date TBA', { exact: true })).toBeVisible();
  await expect(movie.getByText('No image available')).toBeVisible();
  const movieBadge = movie.getByText('Movie', { exact: true });
  const seriesBadge = series.getByText('TV Show', { exact: true });
  await expect(movieBadge).toBeVisible();
  await expect(seriesBadge).toBeVisible();
  const movieColor = await movieBadge.evaluate(
    (element) => getComputedStyle(element.parentElement!).backgroundColor,
  );
  const seriesColor = await seriesBadge.evaluate(
    (element) => getComputedStyle(element.parentElement!).backgroundColor,
  );
  expect(movieColor).not.toBe(seriesColor);

  // Metadata stays inside the artwork, so titles remain legible without hover.
  await expect(
    movie.locator(':scope > div').first().getByText('Test movie', { exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(movie.getByText('Test movie', { exact: true })).toHaveCSS(
    'color',
    'rgb(255, 255, 255)',
  );
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(movie.getByText('Test movie', { exact: true })).toHaveCSS(
    'color',
    'rgb(255, 255, 255)',
  );
  const poster = page.getByRole('link', { name: 'Open Test movie, Movie' }).nth(1);
  await poster.scrollIntoViewIfNeeded();
  await expect(poster.getByLabel('Rating 8.3 out of 10')).toBeVisible();
});
