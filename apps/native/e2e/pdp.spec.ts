import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { expect, test } from '@playwright/test';
const episode = {
  id: 4,
  name: 'Hidden title',
  episode_number: 1,
  season_number: 0,
  air_date: null,
  overview: 'Secret story',
  still_path: '/secret.jpg',
  runtime: 45,
  vote_average: 8,
  vote_count: 10,
};
const extras = {
  companies: [{ id: 1, name: 'Studio Pictures', logo_path: null }],
  collection: { id: 20, name: 'Story Collection' },
  images: [{ file_path: '/one.jpg' }, { file_path: '/two.jpg' }],
  videos: [
    { id: 'v1', key: 'abcdefghijk', name: 'Official trailer', type: 'Trailer', official: true },
    {
      id: 'v2',
      key: 'ABCDEFGHIJK',
      name: 'Behind the scenes',
      type: 'Featurette',
      official: false,
    },
  ],
  keywords: [{ id: 9, name: 'space travel' }],
  releases: [{ key: '3:2000-01-01', label: 'Theatrical', date: '2000-01-01' }],
  seasons: [
    {
      id: 3,
      name: 'Specials',
      season_number: 0,
      episode_count: 1,
      poster_path: null,
      air_date: null,
    },
  ],
  next: null,
  latest: episode,
};

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request()) as { type: 'movie' | 'tv' };
    await route.fulfill({ json: { json: detailFixture(input.type) }, headers: corsHeaders });
  });
  await page.route('**/rpc/catalog/extras*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: extras }, headers: corsHeaders });
  });
  await page.route('**/rpc/catalog/collection*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: {
        json: {
          name: 'Story Collection',
          parts: [{ id: 43, title: 'Story sequel', poster_path: null, release_date: '2001' }],
        },
      },
      headers: corsHeaders,
    });
  });
  await page.route('**/rpc/catalog/season*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    expect(readInput(route.request())).toEqual({ id: 42, season: 0 });
    await route.fulfill({
      json: { json: { name: 'Specials', episodes: [episode] } },
      headers: corsHeaders,
    });
  });
  await page.route('**/rpc/catalog/keyword*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request()) as { type: string; page: number; region: string };
    expect(input.region).toBe('US');
    await route.fulfill({
      json: {
        json: {
          name: 'space travel',
          items: [
            {
              id: 43,
              type: input.type,
              title: 'Space story',
              posterUrl: null,
              backdropUrl: null,
              releaseDate: '',
              rating: 7,
            },
          ],
          page: input.page,
          totalPages: 2,
        },
      },
      headers: corsHeaders,
    });
  });
});
test('image and video viewers select, wrap and close while preserving title details', async ({
  page,
}) => {
  await page.goto('/movie/42?region=US');
  await page.getByRole('button', { name: 'Open image 2 of 2', exact: true }).click();
  await expect(page.getByText('2 / 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next media', exact: true }).click();
  await expect(page.getByText('1 / 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Previous media', exact: true }).click();
  await expect(page.getByText('2 / 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close media viewer', exact: true }).click();
  await page.getByRole('button', { name: 'Watch Videos (2)', exact: true }).click();
  await expect(
    page.getByText('Official trailer · Trailer · Official', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next media', exact: true }).click();
  await expect(page.getByText('Behind the scenes · Featurette', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close media viewer', exact: true }).click();
  await expect(page.getByText('Studio Pictures', { exact: true })).toBeAttached();
  await expect(page.getByText('Theatrical', { exact: true })).toBeAttached();
  await page.getByRole('link', { name: 'Open Story sequel, Movie', exact: true }).click();
  await expect(page).toHaveURL(/\/movie\/43\?region=US/);
});
for (const prefix of ['', '/discover', '/search', '/more']) {
  test(`season and keyword preserve ${prefix || 'Home'} stack, spoiler controls and region`, async ({
    page,
  }) => {
    await page.goto(prefix + '/tv/42?region=US');
    await page.getByRole('link', { name: 'Open Specials', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(prefix + '/tv/42/season/0'));
    await expect(page.getByText('Secret story', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Hidden title', { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Hidden title', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Reveal episode 1', exact: true }).click();
    await expect(page.getByText('Hidden title', { exact: true })).toBeVisible();
    await expect(page.getByText('Secret story', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Hide spoilers', exact: true }).click();
    await expect(page.getByText('Secret story', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Show spoilers', exact: true }).click();
    await expect(page.getByText('Secret story', { exact: true })).toBeVisible();
    await page.goBack();
    await page.getByRole('link', { name: 'space travel', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(prefix + '/keyword/9'));
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Movies', exact: true }).click();
    await expect(page.getByText('Page 1 of 2', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Open Space story, Movie', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(prefix + '/movie/43\\?region=US'));
  });
}
test('additional content retries while core details remain available', async ({ page }) => {
  let fail = true;
  await page.route('**/rpc/catalog/extras*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill(
      fail
        ? { status: 500, json: { error: 'offline' }, headers: corsHeaders }
        : { json: { json: extras }, headers: corsHeaders },
    );
  });
  await page.goto('/movie/42');
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  await expect(
    page.getByText('Couldn’t load additional title information.', { exact: true }),
  ).toBeAttached();
  fail = false;
  await page
    .getByRole('button', { name: 'Retry additional title information', exact: true })
    .click();
  await expect(page.getByText('Studio Pictures', { exact: true })).toBeAttached();
});
test('season retry, empty state and invalid deep links are honest', async ({ page }) => {
  let count = 0;
  await page.route('**/rpc/catalog/season*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    count++;
    await route.fulfill(
      count === 1
        ? { status: 500, json: { error: 'offline' }, headers: corsHeaders }
        : { json: { json: { name: 'Specials', episodes: [] } }, headers: corsHeaders },
    );
  });
  await page.goto('/tv/42/season/0');
  await page.getByRole('button', { name: 'Retry season', exact: true }).click();
  await expect(page.getByText('No episodes available.', { exact: true })).toBeVisible();
  await page.goto('/tv/42/season/-1');
  await expect(page.getByText('Season not found.', { exact: true })).toBeVisible();
  expect(count).toBe(2);
});
for (const theme of ['light', 'dark'] as const) {
  test(`gallery and spoiler controls render in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/tv/42/season/0');
    await expect(page.getByText('Episode details hidden', { exact: true })).toBeVisible();
    await page.screenshot({ path: '/tmp/pr350-native-season-' + theme + '.png', fullPage: true });
    await page.goto('/movie/42');
    await page.getByRole('button', { name: 'Open image 1 of 2', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Next media', exact: true })).toBeInViewport();
    await page.screenshot({ path: '/tmp/pr350-native-gallery-' + theme + '.png' });
  });
}

for (const type of ['movie', 'tv'] as const) {
  test(`${type} credits expose full crew or series episode counts without leaving native`, async ({
    page,
  }) => {
    const person = {
      id: 7,
      creditId: '7',
      name: 'A credited person',
      role: type === 'tv' ? 'Lead, Narrator' : 'Producer',
      profileUrl: null,
    };
    await page.route('**/rpc/catalog/credits*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      const credits =
        type === 'tv'
          ? { cast: [{ ...person, episodeCount: 8 }], directors: [], writers: [] }
          : { cast: [], directors: [], writers: [], crew: [person] };
      await route.fulfill({ json: { json: credits }, headers: corsHeaders });
    });
    await page.goto('/' + type + '/42?region=US');
    if (type === 'movie') {
      await expect(page.getByText('A credited person', { exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'Full Crew', exact: true }).click();
    } else {
      await expect(page.getByText('8 episodes', { exact: true })).toBeAttached();
    }
    await page
      .getByRole('link', { name: 'Open A credited person, ' + person.role, exact: true })
      .click();
    await expect(page).toHaveURL(/\/person\/7\?region=US/);
  });
}

test('keyword failures retry and empty results retain media switching', async ({ page }) => {
  let fail = true;
  await page.route('**/rpc/catalog/keyword*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill(
      fail
        ? { status: 500, json: { error: 'offline' }, headers: corsHeaders }
        : {
            json: { json: { name: 'space travel', items: [], page: 1, totalPages: 0 } },
            headers: corsHeaders,
          },
    );
  });
  await page.goto('/keyword/9?mediaType=tv&region=US');
  await page.getByRole('button', { name: 'Retry keyword titles', exact: true }).waitFor();
  fail = false;
  await page.getByRole('button', { name: 'Retry keyword titles', exact: true }).click();
  await expect(page.getByText('No titles found.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Movies', exact: true }).click();
  await expect(page.getByText('No titles found.', { exact: true })).toBeVisible();
});
