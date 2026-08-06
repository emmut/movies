import { expect, type Page, test } from '@playwright/test';

// The detail pages' deterministic back button pushes the recorded origin URL
// (src/lib/back-target.ts). A push is a forward navigation and never restores
// scroll natively, so the recorded reading position is restored explicitly
// (src/lib/back-scroll.ts). Regression guarded here: without the restore,
// "go back" from a movie landed at the top of discover — and the next
// pagination scroll then visibly ran from the page top.

/** Polls `window.scrollY` until it holds steady across ~500ms of reads. */
async function settledScrollY(page: Page): Promise<number> {
  let stableReads = 0;
  let last = Number.NaN;

  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => Math.round(window.scrollY));
    stableReads = y === last ? stableReads + 1 : 0;
    if (stableReads >= 4) return y;
    last = y;
    await page.waitForTimeout(120);
  }

  return last;
}

test('go back from a movie restores the discover reading position', async ({ page }) => {
  await page.goto('/discover?page=2');
  const cards = page.locator('#content a[href^="/movie/"]');
  await expect(cards.first()).toBeVisible({ timeout: 20_000 });

  // Read from the middle of the list, like a browsing user.
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'instant' }),
  );
  const readingPosition = await page.evaluate(() => Math.round(window.scrollY));
  expect(readingPosition).toBeGreaterThan(200);

  // Click a card that is fully in view, so the click itself doesn't scroll.
  const visibleIndex = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll('#content a[href^="/movie/"]')];
    return anchors.findIndex((anchor) => {
      const rect = anchor.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
  });
  expect(visibleIndex).toBeGreaterThanOrEqual(0);
  await cards.nth(visibleIndex).click();
  await page.waitForURL(/\/movie\//);

  await page.getByRole('button', { name: /go back/i }).click();
  await page.waitForURL(/\/discover\?page=2/);

  // Lands back at the recorded reading position, not the page top.
  const restored = await settledScrollY(page);
  expect(Math.abs(restored - readingPosition)).toBeLessThan(150);
});
