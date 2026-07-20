import { expect, type Page, test } from '@playwright/test';

// Regression (mobile Safari): tapping a pagination link left the viewport
// partway up the page instead of at the top of the results. Paginating is a
// soft navigation, and WebKit fires its own scroll a few hundred ms after the
// `pushState`, clobbering the scroll fired on the click.
//
// This runs under the `mobile-safari` project (WebKit + an iPhone viewport) —
// the engine and form factor where the bug reproduces; Chromium does not
// exhibit it. The discover data is deliberately delayed so the skeleton →
// results swap lands mid-scroll, the timing that lost the scroll.
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
  // Delay the discover server action so the next page's results swap in while
  // the scroll is still animating — the timing that dropped the scroll on
  // Safari. The initial page load is a GET and is unaffected.
  await page.route('**/discover**', async (route) => {
    if (route.request().method() === 'POST') {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    await route.continue();
  });

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
