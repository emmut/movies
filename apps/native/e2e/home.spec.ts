import { expect, test, type Request, type Route } from '@playwright/test';

const title = {
  id: 42,
  type: 'movie',
  title: 'Test movie',
  releaseDate: '2026-10-10',
  posterUrl: null,
  backdropUrl: null,
  rating: 8.2,
};

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};
async function preflight(route: Route) {
  if (route.request().method() !== 'OPTIONS') return false;
  await route.fulfill({ status: 204, headers: corsHeaders });
  return true;
}
function readInput(request: Request) {
  if (request.method() === 'POST') return request.postDataJSON().json;
  return JSON.parse(new URL(request.url()).searchParams.get('data') ?? '{}').json;
}
function responseTitle(input: { type?: string; category?: string }) {
  const type = input.type ?? (input.category?.endsWith('movies') ? 'movie' : 'tv');
  return { ...title, type, title: type === 'movie' ? 'Test movie' : 'Test series' };
}

test('renders the homepage, changes regional queries, and opens web details', async ({ page }) => {
  const regions: string[] = [];
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) return;
    const input = readInput(route.request());
    if (input.region) regions.push(input.region);
    await route.fulfill({ json: { json: [responseTitle(input)] }, headers: corsHeaders });
  });
  await page
    .context()
    .route('http://localhost:3000/**', (route) => route.fulfill({ body: 'Title details' }));
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
  const popup = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Open Test movie, Movie' }).first().click();
  await expect(await popup).toHaveURL('http://localhost:3000/movie/42');
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
  await expect(card.locator(':scope > div').first()).toHaveCSS('height', '200px');
  const heading = page.getByText('Trending Now', { exact: true });
  const lightColor = await heading.evaluate((element) => getComputedStyle(element).color);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect
    .poll(() => heading.evaluate((element) => getComputedStyle(element).color))
    .not.toBe(lightColor);
});
