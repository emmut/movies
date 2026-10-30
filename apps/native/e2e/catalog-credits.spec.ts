import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { expect, test } from '@playwright/test';

const actor = {
  id: 7,
  creditId: 'cast-7',
  name: 'A performer',
  role: 'The lead',
  profileUrl: null,
};
const credits = {
  cast: [
    actor,
    {
      ...actor,
      id: 8,
      creditId: 'cast-8',
      name: 'Another performer',
      role: '',
      profileUrl: 'https://images.example/broken.jpg',
    },
  ],
  directors: [{ ...actor, creditId: 'director-7', role: 'Director' }],
  writers: [{ ...actor, creditId: 'writer-7', role: 'Screenplay' }],
};

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: { json: detailFixture(readInput(route.request()).type) },
      headers: corsHeaders,
    });
  });
});

for (const source of ['', '/discover', '/search', '/more']) {
  test(`credits preserve ${source || 'Home'} stack and restore title scroll on back`, async ({
    page,
  }) => {
    await page.route('**/rpc/catalog/credits*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      expect(readInput(route.request())).toEqual({ id: 42, type: 'movie' });
      await route.fulfill({ json: { json: credits }, headers: corsHeaders });
    });
    await page.route('https://images.example/**', (route) => route.abort());
    await page.route('**/rpc/person/details*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      await route.fulfill({
        json: {
          json: {
            id: 7,
            name: actor.name,
            biography: 'A biography.',
            profileUrl: null,
            birthday: null,
            deathday: null,
            birthplace: '',
            department: 'Acting',
            aliases: [],
            popularity: 1,
            homepage: null,
            imdbUrl: null,
          },
        },
        headers: corsHeaders,
      });
    });
    await page.route('**/rpc/person/credits*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      await route.fulfill({ json: { json: [] }, headers: corsHeaders });
    });
    await page.goto(`${source}/movie/42?region=US`);
    await expect(page.getByRole('heading', { name: 'Directors', exact: true })).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Writers', exact: true })).toBeAttached();
    const cast = page.getByRole('link', { name: 'Open A performer, The lead', exact: true });
    await cast.scrollIntoViewIfNeeded();
    await expect(page.getByLabel('No photo available').first()).toBeAttached();
    await expect(page.getByLabel('Profile image of Another performer')).not.toBeAttached();
    const scroll = page.getByTestId('catalog-scroll');
    const before = await scroll.evaluate((element) => element.scrollTop);
    await cast.click();
    await expect(page).toHaveURL(new RegExp(`${source}/person/7\\?region=US$`));
    await expect(page.getByText('A biography.', { exact: true })).toBeAttached();
    await page.goBack();
    await expect(cast).toBeVisible();
    await expect
      .poll(() => scroll.evaluate((element) => element.scrollTop))
      .toBeCloseTo(before, -1);
  });
}

test('credits retry independently while overview remains readable', async ({ page }) => {
  let fail = true;
  await page.route('**/rpc/catalog/credits*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    expect(readInput(route.request()).type).toBe('tv');
    if (fail) {
      await route.fulfill({
        status: 500,
        json: { message: 'Internal server error' },
        headers: corsHeaders,
      });
      return;
    }
    await route.fulfill({
      json: { json: { ...credits, directors: [], writers: [] } },
      headers: corsHeaders,
    });
  });
  await page.goto('/tv/42');
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  const retry = page.getByRole('button', { name: 'Retry credits' });
  await retry.scrollIntoViewIfNeeded();
  fail = false;
  await retry.click();
  await expect(page.getByRole('heading', { name: 'Cast', exact: true })).toBeAttached();
  await expect(retry).not.toBeAttached();
  await expect(page.getByRole('heading', { name: 'Directors', exact: true })).not.toBeAttached();
});

test('empty credits omit all section headings', async ({ page }) => {
  await page.goto('/movie/42');
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  await expect(page.getByLabel('Loading credits')).not.toBeAttached();
  for (const name of ['Directors', 'Writers', 'Cast']) {
    await expect(page.getByRole('heading', { name, exact: true })).not.toBeAttached();
  }
});

test('slow credits do not block the title or overview', async ({ page }) => {
  let release = function release() {};
  const responseReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/rpc/catalog/credits*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await responseReady;
    await route.fulfill({ json: { json: credits }, headers: corsHeaders });
  });
  await page.goto('/movie/42');
  await expect(page.getByLabel('Loading credits')).toBeAttached();
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  release();
  await expect(page.getByRole('heading', { name: 'Cast', exact: true })).toBeAttached();
  await expect(page.getByLabel('Loading credits')).not.toBeAttached();
});
