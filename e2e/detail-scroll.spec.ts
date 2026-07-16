import { expect, type Page, test } from '@playwright/test';

import { MOVIE_PATH } from './helpers';

// Regression: arriving on a detail page (movie / tv / person) scrolled partway
// down instead of at the top.
//
// Each detail route has its own `loading.tsx` boundary, so a client-side
// navigation into it renders the skeleton before the real content streams in.
// When a skeleton was much taller than the above-the-fold content, the final
// scroll position could settle partway down the page. The fix aligned the
// person skeleton with the (already-short) movie/tv ones. These tests pin the
// invariant for all three: navigating in from a scrolled position lands at the
// top once the real content has replaced the skeleton.

/**
 * From a source page listing links of a given kind, navigates into one from a
 * scrolled-down position and asserts the destination lands at the top.
 *
 * Clicking an in-app link is a client-side navigation, so the destination's
 * `loading.tsx` boundary renders before the real content arrives — exactly the
 * path the scroll bug lived on.
 *
 * @param page - The Playwright page.
 * @param linkSelector - CSS selector matching links to the target detail route.
 * @param urlPattern - Expected destination URL.
 */
async function expectNavigationLandsAtTop(page: Page, linkSelector: string, urlPattern: RegExp) {
  // The source page's own level-1 heading, if it has one (the discover page's
  // title is an <h2>, the movie page's is an <h1>). Used below to tell the
  // destination content apart from the still-visible source route mid-transition.
  const h1 = page.getByRole('heading', { level: 1 });
  const sourceHeading = (await h1.count()) > 0 ? (await h1.first().textContent())?.trim() : undefined;

  // Drop to the bottom so we navigate away from a scrolled-down position.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // The last matching link sits near the bottom, so clicking it keeps us
  // scrolled down rather than yanking back to the top before navigating.
  const link = page.locator(linkSelector).last();
  await link.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await link.click();

  await page.waitForURL(urlPattern);

  // Wait for the destination's own content before measuring scroll. A generic
  // heading check would pass early: the source route can stay visible while the
  // destination streams, and its heading (or the skeleton) would satisfy it, so
  // we'd sample the scroll position before the destination settled. The
  // destination's <h1> carries the title; when the source has its own <h1> we
  // exclude its text so we don't match the still-visible source heading.
  const destinationHeading = sourceHeading ? h1.filter({ hasNotText: sourceHeading }) : h1;
  // Detail pages stream in behind a loading.tsx skeleton once their server
  // component resolves; on a cold server that can take longer than the default
  // 5s assertion timeout, so give the heading the same headroom as the link.
  await expect(destinationHeading.first()).toBeVisible({ timeout: 15_000 });

  // Once the real content is in, the viewport should be at the top.
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 })
    .toBeLessThan(50);
}

test('navigating into a movie page from a scrolled position lands at the top', async ({ page }) => {
  await page.goto('/discover');
  await expect(page.locator('#content-container a[href^="/movie/"]').first()).toBeVisible({
    timeout: 15_000,
  });

  await expectNavigationLandsAtTop(page, '#content-container a[href^="/movie/"]', /\/movie\/\d+/);
});

test('navigating into a tv page from a scrolled position lands at the top', async ({ page }) => {
  await page.goto('/discover?mediaType=tv');
  await expect(page.locator('#content-container a[href^="/tv/"]').first()).toBeVisible({
    timeout: 15_000,
  });

  await expectNavigationLandsAtTop(page, '#content-container a[href^="/tv/"]', /\/tv\/\d+/);
});

test('navigating into a person page from a scrolled position lands at the top', async ({
  page,
}) => {
  // The movie detail page lists cast/crew, each linking to a person page.
  await page.goto(MOVIE_PATH);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await expectNavigationLandsAtTop(page, 'a[href^="/person/"]', /\/person\/\d+/);
});
