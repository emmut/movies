import { expect, type Page, test } from '@playwright/test';

import { signInAnonymously } from './helpers';

// Paginating scrolls to the top of the results: the click schedules the
// scroll and PaginationControls performs it once the new page is on screen
// (see src/lib/scroll-to-content.ts), so a mid-navigation render can't move
// the ground under it.
//
// This runs under the `mobile-safari` project (WebKit + an iPhone viewport) —
// the engine and form factor where click-time scrolling historically lost the
// scroll.
//
// Invariant: after paginating from a scrolled-down position, the viewport
// settles at the top of `#content` (its first item, minus the
// `scroll-m-5` gap), not at the page top.

const SCROLL_MARGIN = 20; // scroll-m-5 on #content (1.25rem)

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

/** The href of the first movie card currently in the results grid, or ''. */
function firstCardHref(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      document.querySelector('#content a[href^="/movie/"]')?.getAttribute('href') ?? '',
  );
}

test('paginating lands at the top of the results, not the page top', async ({ page }) => {
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

  // Lands on the results (top of the first item, minus the small scroll-margin
  // gap) — not yanked to the page top (the bug) and not left far down the page.
  expect(finalY).toBeGreaterThan(containerTop - SCROLL_MARGIN - 60);
  expect(finalY).toBeLessThan(containerTop + 60);
});

// Users with saved streaming services hit a different data path on a bare
// /discover URL: the server prefetches with their saved providers while the
// client hook derives its React Query key from the URL alone. When those
// disagreed, the dehydrated data was orphaned and every navigation re-fetched
// client-side with the wrong (major-providers) filter — skeleton swaps, a
// vanishing pagination bar, and pagination scrolling from the page top
// instead of from where the user was. With the client pinned to the server's
// provider fallback, the keys match and each page arrives once, already
// hydrated: no client re-fetch ever fires.
test('pagination for a user with saved providers stays on the hydrated data', async ({
  page,
}) => {
  await signInAnonymously(page, '/settings');
  await page
    .getByRole('button')
    .filter({ has: page.getByText('Netflix', { exact: true }) })
    .first()
    .click();
  await page.getByRole('button', { name: 'Save Preferences' }).click();
  await expect(page.getByText('Preferences saved!')).toBeVisible({ timeout: 15_000 });

  // Client-side discover re-fetches are server-action POSTs. None may happen:
  // a POST here means the client's React Query key missed the data the server
  // prefetched and dehydrated — the provider-fallback mismatch this test pins.
  const actionPosts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/discover')) {
      actionPosts.push(request.postData() ?? '');
    }
  });

  await page.goto('/discover');
  const firstCard = page.locator('#content a[href^="/movie/"]').first();
  await expect(firstCard).toBeVisible({ timeout: 20_000 });
  const firstHrefBefore = await firstCardHref(page);

  const containerTop = await page.evaluate(() => {
    const el = document.querySelector('#content')!;
    return Math.round(el.getBoundingClientRect().top + window.scrollY);
  });
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

  // Both the initial load and the pagination were served by the dehydrated
  // server prefetch — the client never had to re-fetch.
  expect(actionPosts).toHaveLength(0);

  // And the scroll invariant holds on this path too: settle at the top of the
  // results, not the page top.
  const finalY = await settledScrollY(page);
  expect(finalY).toBeGreaterThan(containerTop - SCROLL_MARGIN - 60);
  expect(finalY).toBeLessThan(containerTop + 60);
});
