import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { mockAccountRegion, sessionResponse } from '@native/e2e/session-fixtures';
import { expect, test } from '@playwright/test';

const movie = {
  id: 42,
  type: 'movie',
  title: 'A discovered movie',
  releaseDate: '2025-01-01',
  posterUrl: null,
  backdropUrl: null,
  rating: 8,
};
const second = { ...movie, id: 43, title: 'Another movie' };
const person = {
  id: 7,
  type: 'person',
  name: 'A performer',
  profileUrl: null,
  department: 'Acting',
  knownFor: ['A discovered movie'],
};

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/discovery/options*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      headers: corsHeaders,
      json: { json: { genres: [{ id: 12, name: 'Adventure' }], providers: [], countries: [] } },
    });
  });
  await page.route('**/rpc/discovery/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      headers: corsHeaders,
      json: {
        json: {
          items: [movie, second].map((item) => ({
            ...item,
            type: readInput(route.request()).type,
          })),
          totalPages: 1,
          totalResults: 2,
        },
      },
    });
  });
  await page.route('**/rpc/search/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      headers: corsHeaders,
      json: {
        json: {
          items: [movie, second, person].filter((item) => {
            const type = readInput(route.request()).type;
            return type === 'all' || item.type === type;
          }),
          totalPages: 1,
        },
      },
    });
  });
});

for (const theme of ['light', 'dark'] as const) {
  test(`Discover exposes the selected type and dropdown in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/discover');
    const movies = page.getByRole('button', { name: 'Movies', exact: true });
    const tv = page.getByRole('button', { name: 'TV Shows', exact: true });
    await expect(movies).toHaveAttribute('aria-pressed', 'true');
    const selectedColor = await movies.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(selectedColor).not.toBe(
      await tv.evaluate((element) => getComputedStyle(element).backgroundColor),
    );
    await tv.click();
    await expect(tv).toHaveAttribute('aria-pressed', 'true');
    await expect(movies).toHaveAttribute('aria-pressed', 'false');
    await expect(tv).toHaveCSS('background-color', selectedColor);
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await page.getByRole('button', { name: 'Genres', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: 'Adventure', exact: true })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Adventure', exact: true }).click();
    await page.getByRole('button', { name: 'Close Genres', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Filters (1)', exact: true })).toBeVisible();
    await page.screenshot({ path: `/tmp/native-discover-overhaul-${theme}.png` });
  });
}

for (const width of [320, 390, 430]) {
  test(`Search uses clear tabs and a spaced grid at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/search?q=story');
    const submit = page.getByRole('button', { name: 'Submit search' });
    const submitBounds = (await submit.boundingBox())!;
    expect(submitBounds.x + submitBounds.width).toBeLessThanOrEqual(width - 16);
    const field = (await page
      .getByRole('textbox', { name: 'Search movies, TV shows and people' })
      .boundingBox())!;
    expect(field.x + field.width).toBeLessThan(submitBounds.x);
    const tabs = page.getByLabel('Search media type', { exact: true });
    const all = tabs.getByRole('button', { name: 'All', exact: true });
    await expect(all).toHaveAttribute('aria-pressed', 'true');
    const first = page.getByRole('link', { name: 'Open A discovered movie, Movie' });
    const next = page.getByRole('link', { name: 'Open Another movie, Movie' });
    await expect(first).toBeVisible();
    const a = (await first.boundingBox())!;
    const b = (await next.boundingBox())!;
    expect(a.x).toBe(16);
    expect(b.x - a.x - a.width).toBeCloseTo(16, 0);
    expect(width - b.x - b.width).toBeCloseTo(16, 0);
    const profile = page.getByRole('link', { name: 'Open A performer, Person' });
    expect((await profile.boundingBox())!.width).toBeCloseTo(a.width, 0);
    const people = tabs.getByRole('button', { name: 'People', exact: true });
    await people.click();
    await expect(people).toHaveAttribute('aria-pressed', 'true');
    await expect(all).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await page.screenshot({ path: `/tmp/native-search-overhaul-${width}.png` });
  });
}

for (const target of ['discover', 'search'] as const) {
  test(`${target} shows full poster skeletons until results arrive`, async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const path = target === 'discover' ? 'discovery/list' : 'search/list';
    await page.route('**/rpc/' + path + '*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      await gate;
      const data =
        target === 'discover'
          ? { items: [movie, second], totalPages: 1, totalResults: 2 }
          : { items: [movie, second], totalPages: 1 };
      await route.fulfill({ headers: corsHeaders, json: { json: data } });
    });
    await page.goto('/' + target + '?q=story');
    await expect(
      page.getByRole('progressbar', {
        name: target === 'discover' ? 'Loading discovered titles' : 'Loading search results',
      }),
    ).toBeVisible();
    const placeholders = page.getByTestId('poster-grid-skeleton');
    await expect(placeholders.getByTestId('poster-skeleton')).toHaveCount(6);
    const before = (await placeholders.getByTestId('poster-skeleton').first().boundingBox())!;
    await page.screenshot({ path: `/tmp/native-${target}-skeleton.png` });
    release();
    const result = page.getByRole('link', { name: 'Open A discovered movie, Movie' });
    await expect(result).toBeVisible();
    await expect(placeholders).not.toBeAttached();
    const after = (await result.boundingBox())!;
    expect(after.x).toBe(before.x);
    expect(after.width).toBeCloseTo(before.width, 0);
    expect(after.height).toBeCloseTo(before.height, 0);
  });
}

test('More waits for the session and switches from sign out to sign in', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let signedIn = true;
  await mockAccountRegion(page, 'SE');
  await page.route('**/api/auth/get-session*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await gate;
    const session = sessionResponse();
    session.user = { ...session.user, isAnonymous: false };
    await route.fulfill({ headers: corsHeaders, json: signedIn ? session : null });
  });
  await page.route('**/api/auth/sign-out*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    signedIn = false;
    await route.fulfill({ headers: corsHeaders, json: { success: true } });
  });
  await page.goto('/more');
  await expect(page.getByRole('progressbar', { name: 'Loading your session' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).not.toBeAttached();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).not.toBeAttached();
  release();
  const signOut = page.getByRole('button', { name: 'Sign out', exact: true });
  await expect(signOut).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).not.toBeAttached();
  await signOut.click();
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
  await expect(signOut).not.toBeAttached();
});

test('title details use a skeleton and reveal content after loading', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await gate;
    await route.fulfill({ headers: corsHeaders, json: { json: detailFixture('movie') } });
  });
  await page.goto('/movie/42');
  await expect(page.getByRole('progressbar', { name: 'Loading title', exact: true })).toBeVisible();
  release();
  await expect(page.getByText('A memorable story.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('detail-skeleton')).not.toBeAttached();
});
