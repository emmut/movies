import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { expect, test } from '@playwright/test';

const movie = {
  id: 42,
  type: 'movie',
  title: 'Alien',
  releaseDate: '1979-01-01',
  posterUrl: null,
  backdropUrl: null,
  rating: 8.2,
};
const person = {
  id: 7,
  type: 'person',
  name: 'Sigourney Weaver',
  profileUrl: null,
  department: 'Acting',
  knownFor: ['Alien'],
};
const details = {
  id: 7,
  name: 'Sigourney Weaver',
  biography: 'A performer biography.',
  profileUrl: null,
  birthday: '1949-10-08',
  deathday: null,
  birthplace: 'New York, United States',
  department: 'Acting',
  aliases: ['An alias'],
  popularity: 10.8,
  homepage: null,
  imdbUrl: 'https://www.imdb.com/name/nm0000244/',
};

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/search/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    const items = input.type === 'person' ? [person] : [movie, person];
    await route.fulfill({ json: { json: { items, totalPages: 3 } }, headers: corsHeaders });
  });
  await page.route('**/rpc/person/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: details }, headers: corsHeaders });
  });
  await page.route('**/rpc/person/credits*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    await route.fulfill({
      json: { json: input.type === 'movie' ? [movie] : [] },
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

test('search submits a query, preserves type choice and stays in the native results stack', async ({
  page,
}) => {
  const inputs: Record<string, unknown>[] = [];
  await page.route('**/rpc/search/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    inputs.push(readInput(route.request()));
    await route.fulfill({
      json: { json: { items: [person], totalPages: 3 } },
      headers: corsHeaders,
    });
  });
  await page.goto('/search');
  await expect(page.getByText('Find movies, TV shows and people.')).toBeVisible();
  expect(inputs).toHaveLength(0);
  await page.getByRole('button', { name: 'Media type', exact: true }).click();
  await page.getByRole('radio', { name: 'People', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Media type' })).toHaveText('People');
  await page
    .getByRole('textbox', { name: 'Search movies, TV shows and people' })
    .fill('  weaver  ');
  await page.getByRole('button', { name: 'Submit search' }).click();
  await expect.poll(() => inputs.at(-1)).toEqual({ query: 'weaver', page: 1, type: 'person' });
  await expect(page.getByRole('link', { name: 'Open Sigourney Weaver, Person' })).toBeVisible();
  expect(page.context().pages()).toHaveLength(1);
});

test('movie and person results retain their search query/page on browser back', async ({
  page,
}) => {
  await page.goto('/search?q=alien&page=2');
  await page.getByRole('link', { name: 'Open Alien, Movie' }).click();
  await expect(page).toHaveURL(/\/search\/movie\/42$/);
  await expect(page.getByText('A memorable story.', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/search\?q=alien&page=2$/);
  await page.getByRole('link', { name: 'Open Sigourney Weaver, Person' }).click();
  await expect(page).toHaveURL(/\/search\/person\/7$/);
  await expect(page.getByText('A performer biography.')).toBeVisible();
  await expect(page.getByText('No Photo Available', { exact: true })).toBeVisible();
  await expect(page.getByText('An alias', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/search\?q=alien&page=2$/);
  expect(page.context().pages()).toHaveLength(1);
});

test('person filmography opens native movie details and restores the person', async ({ page }) => {
  await page.goto('/search/person/7');
  await page.getByRole('link', { name: 'Open Alien, Movie' }).click();
  await expect(page).toHaveURL(/\/search\/movie\/42$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/search\/person\/7$/);
  await expect(page.getByText('A performer biography.')).toBeAttached();
  await expect(page.getByRole('link', { name: 'IMDb (opens browser)' })).toBeAttached();
  await page.screenshot({ path: '/tmp/movies-native-person.png' });
});

test('pagination and media changes retain query and reset page when appropriate', async ({
  page,
}) => {
  await page.goto('/search?q=alien');
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText('Page 2 of 3')).toBeVisible();
  await page.getByRole('button', { name: 'Previous page', exact: true }).click();
  await expect(page.getByText('Page 1 of 3')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous page', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Media type', exact: true }).click();
  await page.getByRole('radio', { name: 'People', exact: true }).click();
  await expect(page).toHaveURL(/mediaType=person/);
  await expect(
    page.getByRole('textbox', { name: 'Search movies, TV shows and people' }),
  ).toHaveValue('alien');
  await expect(page.getByRole('link', { name: 'Open Sigourney Weaver, Person' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Alien, Movie' })).not.toBeAttached();
});

test('empty/error search states remain native and recover after retry', async ({ page }) => {
  let attempts = 0;
  await page.route('**/rpc/search/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    attempts += 1;
    if (attempts <= 2) {
      await route.fulfill({ status: 500, headers: corsHeaders, body: 'offline' });
      return;
    }
    await route.fulfill({ json: { json: { items: [], totalPages: 0 } }, headers: corsHeaders });
  });
  await page.goto('/search?q=nothing');
  await expect(page.getByText('Couldn’t load search results.')).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText('No results for “nothing”.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  expect(page.context().pages()).toHaveLength(1);
});

test('person supporting failures leave biography usable and can retry independently', async ({
  page,
}) => {
  let attempts = 0;
  await page.route('**/rpc/person/credits*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    if (input.type === 'movie') {
      attempts += 1;
      if (attempts === 1) {
        await route.fulfill({ status: 500, headers: corsHeaders, body: 'offline' });
        return;
      }
    }
    await route.fulfill({
      json: { json: input.type === 'movie' ? [movie] : [] },
      headers: corsHeaders,
    });
  });
  await page.goto('/search/person/7');
  await expect(page.getByText('A performer biography.')).toBeAttached();
  await page.getByRole('button', { name: 'Retry Movies', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open Alien, Movie' })).toBeAttached();
});

test('invalid person IDs are rejected locally and not-found/errors have distinct recovery', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/rpc/person/details')) {
      requests.push(request.url());
    }
  });
  await page.goto('/search/person/invalid');
  await expect(page.getByRole('heading', { name: 'Person not found', exact: true })).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Go to Home', exact: true }).click();
  await expect(page).toHaveURL(/localhost:8083\/$/);
});

for (const bothFail of [false, true]) {
  test(`unavailable filmography does not present a ${bothFail ? 'zero' : 'partial'} credit total`, async ({
    page,
  }) => {
    await page.route('**/rpc/person/credits*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      const input = readInput(route.request());
      if (input.type === 'movie' || bothFail) {
        await route.fulfill({
          status: 500,
          json: {
            json: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'offline',
              status: 500,
              defined: false,
            },
          },
          headers: corsHeaders,
        });
        return;
      }
      await route.fulfill({
        json: {
          json: [
            { ...movie, type: 'tv' },
            { ...movie, id: 43, type: 'tv' },
          ],
        },
        headers: corsHeaders,
      });
    });
    await page.goto('/search/person/7');
    await expect(page.getByRole('button', { name: 'Retry Movies', exact: true })).toBeAttached();
    const stat = page.getByText('Credits', { exact: true }).locator('..');
    await expect(stat).toContainText('—');
    await page.getByRole('button', { name: 'Retry Movies', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Retry Movies', exact: true })).toBeAttached();
    await expect(stat).toContainText('—');
  });
}
