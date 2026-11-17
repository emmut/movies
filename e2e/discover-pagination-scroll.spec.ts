import { expect, type Page, test } from '@playwright/test';

import { signInAnonymously } from './helpers';

// Paginating scrolls to the top of the results: the click schedules the
// scroll and PaginationControls performs it once the next page's query state
// (including loading skeletons) is on screen, before the request finishes.
//
// This runs under the `mobile-safari` project (WebKit + a narrow viewport) —
// the engine and viewport size where the route handoff historically clamped
// the scroll, on both iPhone Safari and narrow Safari windows on macOS.
//
// Invariant: after paginating from a scrolled-down position, the viewport
// approaches and settles at the top of `#content` (its first item, minus the
// `scroll-m-5` gap) without jumping above it first.
//
// The header is sticky, so the root's `scroll-padding-top` holds `#content`
// clear of it — the resting offset is that much further up the document than
// the container's own position. Measured rather than hardcoded so the header
// and this test can't drift apart.

const SCROLL_MARGIN = 20; // scroll-m-5 on #content (1.25rem)

type ScrollSamplingWindow = Window & {
  __paginationScrollFrame?: number;
  __paginationScrollSamples?: number[];
};

/** Height of the sticky header, which the root scroll-padding reserves. */
function headerHeight(page: Page): Promise<number> {
  return page.evaluate(() =>
    Math.round(document.querySelector('header')?.getBoundingClientRect().height ?? 0),
  );
}

/**
 * Asserts the settled scroll position rests at the top of the results: below
 * the sticky header, not yanked to the page top and not left down the page.
 *
 * @param finalY - The settled `window.scrollY`.
 * @param containerTop - `#content`'s document offset, measured at rest.
 * @param header - The sticky header's height.
 */
function expectRestingAtResultsTop(finalY: number, containerTop: number, header: number) {
  const expectedY = containerTop - header - SCROLL_MARGIN;
  expect(finalY).toBeGreaterThan(expectedY - 60);
  expect(finalY).toBeLessThan(expectedY + 60);
}

/**
 * Polls `window.scrollY` until it holds steady, so we measure where the scroll
 * comes to rest rather than a frame mid-animation (or mid-cancellation).
 *
 * @param page - The Playwright page.
 */
async function settledScrollY(page: Page): Promise<number> {
  let stableReads = 0;
  let last = Number.NaN;

  for (let i = 0; i < 60; i++) {
    const y = await page.evaluate(() => Math.round(window.scrollY));
    stableReads = y === last ? stableReads + 1 : 0;
    // Steady across ~500ms of polling counts as settled.
    if (stableReads >= 4) return y;
    last = y;
    await page.waitForTimeout(120);
  }

  return last;
}

/** Samples the whole pagination animation so a transient jump cannot hide behind the final state. */
async function startScrollSampling(page: Page) {
  await page.evaluate(() => {
    const samplingWindow = window as ScrollSamplingWindow;
    samplingWindow.__paginationScrollSamples = [];

    function sample() {
      samplingWindow.__paginationScrollSamples?.push(Math.round(window.scrollY));
      samplingWindow.__paginationScrollFrame = requestAnimationFrame(sample);
    }

    sample();
  });
}

async function stopScrollSampling(page: Page) {
  return page.evaluate(() => {
    const samplingWindow = window as ScrollSamplingWindow;
    cancelAnimationFrame(samplingWindow.__paginationScrollFrame ?? 0);
    return samplingWindow.__paginationScrollSamples ?? [];
  });
}

/** The href of the first movie card currently in the results grid, or ''. */
function firstCardHref(page: Page): Promise<string> {
  return page.evaluate(
    () => document.querySelector('#content a[href^="/movie/"]')?.getAttribute('href') ?? '',
  );
}

// Signed-in users get a heavier grid (list actions on every card), which moves
// the results swap into the same task as the pagination scroll — the timing
// where WebKit clamped the scroll before the new page had been laid out.
for (const signedIn of [false, true]) {
  test(`paginating lands at the top of the results, not the page top (${signedIn ? 'signed in' : 'signed out'})`, async ({
    page,
  }) => {
    if (signedIn) {
      await signInAnonymously(page);
    }
    await paginateAndExpectResultsTop(page);
  });
}

async function paginateAndExpectResultsTop(page: Page) {
  await page.goto('/discover');
  const container = page.locator('#content');
  const firstCard = container.locator('a[href^="/movie/"]').first();
  await expect(firstCard).toBeVisible({ timeout: 20_000 });

  // The results container's offset is stable across pages, so capture it while
  // resting at the top: this is where "the top of the results" lives.
  const containerTop = await page.evaluate(() => {
    const el = document.querySelector('#content')!;
    return Math.round(el.getBoundingClientRect().top + window.scrollY);
  });
  const header = await headerHeight(page);

  // Remember page 1's first result so we can tell when page 2 has swapped in.
  const firstHrefBefore = await firstCardHref(page);
  expect(firstHrefBefore).not.toBe('');

  // Navigate away from a scrolled-down position, as a user at the bottom-of-page
  // pagination controls would.
  // behavior:'instant' so the precondition below never reads a mid-animation
  // position, regardless of any smooth-scrolling CSS.
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
  );
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(containerTop);
  await startScrollSampling(page);

  // Click Next, then wait past the loading skeletons until page 2's cards have
  // actually replaced page 1's — the grid swap (and any scroll it disturbs)
  // must have happened before we measure.
  await page.getByRole('button', { name: /go to next page/i }).click();
  await page.waitForURL(/page=2/);
  await expect
    .poll(
      async () => {
        const href = await firstCardHref(page);
        return href !== '' && href !== firstHrefBefore;
      },
      { timeout: 20_000 },
    )
    .toBe(true);

  const finalY = await settledScrollY(page);
  const scrollSamples = await stopScrollSampling(page);

  // Lands on the results (top of the first item, minus the small scroll-margin
  // gap) — not yanked above it first (the narrow-WebKit bug), and not left
  // far down the page.
  expectRestingAtResultsTop(finalY, containerTop, header);
  expect(Math.min(...scrollSamples)).toBeGreaterThan(containerTop - header - SCROLL_MARGIN - 60);
}

test('scrolls to loading skeletons before the next Discover request finishes', async ({ page }) => {
  await page.goto('/discover?genreId=28');
  const container = page.locator('#content');
  await expect(container.locator('a[href^="/movie/"]').first()).toBeVisible();
  const firstHrefBefore = await firstCardHref(page);
  const containerTop = await container.evaluate((element) =>
    Math.round(element.getBoundingClientRect().top + window.scrollY),
  );
  const header = await headerHeight(page);
  let releaseRequest = () => {};
  const responseGate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  await page.route('**/api/rpc/discovery/list*', async (route) => {
    await responseGate;
    await route.continue();
  });
  const serverNavigations: string[] = [];
  page.on('request', (request) => {
    if (
      new URL(request.url()).pathname === '/discover' &&
      request.headers()['rsc'] === '1' &&
      request.headers()['next-router-prefetch'] !== '1'
    ) {
      serverNavigations.push(request.url());
    }
  });

  try {
    await page.getByRole('button', { name: /go to next page/i }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page).toHaveURL(/genreId=28/);
    await expect(container.locator('[data-slot="item-card-skeleton"]')).toHaveCount(20);
    await expect(container.locator('a[href^="/movie/"]')).toHaveCount(0);
    const finalY = await settledScrollY(page);
    expectRestingAtResultsTop(finalY, containerTop, header);
    expect(serverNavigations).toHaveLength(0);
  } finally {
    releaseRequest();
  }

  await expect(container.locator('a[href^="/movie/"]').first()).toBeVisible();
  expect(await firstCardHref(page)).not.toBe(firstHrefBefore);
  await expect(container.locator('[data-slot="item-card-skeleton"]')).toHaveCount(0);
  expectRestingAtResultsTop(await settledScrollY(page), containerTop, header);

  await page.goBack();
  await expect(page).toHaveURL(/genreId=28/);
  await expect.poll(() => firstCardHref(page)).toBe(firstHrefBefore);
});

// Users with saved streaming services hit a different data path on a bare
// /discover URL: the server prefetches with their saved providers while the
// client hook derives its React Query key from the URL alone. When those
// disagreed, the dehydrated data was orphaned and every navigation re-fetched
// client-side with the wrong (major-providers) filter — skeleton swaps, a
// vanishing pagination bar, and pagination scrolling from the page top
// instead of from where the user was. With the client pinned to the server's
// provider fallback, the keys match: the initial page stays hydrated and
// shallow pagination fetches the next page with the same provider defaults.
test('pagination for a user with saved providers preserves the provider filter', async ({ page }) => {
  await signInAnonymously(page, '/settings');
  await page
    .getByRole('button')
    .filter({ has: page.getByText('Netflix', { exact: true }) })
    .first()
    .click();
  await page.getByRole('button', { name: 'Save Preferences' }).click();
  await expect(page.getByText('Preferences saved!')).toBeVisible({ timeout: 15_000 });

  // Initial results use the dehydrated query; the next page uses one client
  // RPC request with the same saved provider defaults.
  const clientReads: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/rpc/discovery/list') {
      clientReads.push(url.searchParams.get('data') ?? request.postData() ?? '');
    }
  });

  await page.goto('/discover');
  const firstCard = page.locator('#content a[href^="/movie/"]').first();
  await expect(firstCard).toBeVisible({ timeout: 20_000 });
  const firstHrefBefore = await firstCardHref(page);
  expect(clientReads).toHaveLength(0);

  const containerTop = await page.evaluate(() => {
    const el = document.querySelector('#content')!;
    return Math.round(el.getBoundingClientRect().top + window.scrollY);
  });
  const header = await headerHeight(page);
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
  );

  await page.getByRole('button', { name: /go to next page/i }).click();
  await page.waitForURL(/page=2/);
  await expect
    .poll(
      async () => {
        const href = await firstCardHref(page);
        return href !== '' && href !== firstHrefBefore;
      },
      { timeout: 20_000 },
    )
    .toBe(true);

  expect(clientReads).toHaveLength(1);
  expect(clientReads[0]).toContain('"providerIds":[8]');

  // And the scroll invariant holds on this path too: settle at the top of the
  // results, not the page top.
  const finalY = await settledScrollY(page);
  expectRestingAtResultsTop(finalY, containerTop, header);
});
