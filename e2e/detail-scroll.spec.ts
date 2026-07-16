import { expect, type Locator, type Page, test } from '@playwright/test';

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
//
// Destinations are reached from a stable person / movie whose top-billed links
// resolve to well-known titles. Navigating into whatever happened to be last on
// discover was flaky: that item changes daily, and an obscure title's detail
// page can be slow to stream (or 404), so the heading never appeared in time.

/**
 * From a scrolled-down position, clicks `link` (a client-side navigation into a
 * detail route) and asserts the destination lands at the top once its real
 * content has replaced the loading skeleton.
 *
 * @param page - The Playwright page.
 * @param link - A locator for the in-app link to click.
 * @param urlPattern - Expected destination URL.
 */
async function expectNavigationLandsAtTop(page: Page, link: Locator, urlPattern: RegExp) {
  // The source page's own level-1 heading, if any, so we can tell the
  // destination's <h1> apart from a source heading left visible mid-transition.
  const h1 = page.getByRole('heading', { level: 1 });
  const sourceHeading = (await h1.count()) > 0 ? (await h1.first().textContent())?.trim() : undefined;

  // Drop to the bottom, then bring the link into view, so we navigate away from
  // a scrolled-down position rather than the top.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
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
  await expect(destinationHeading.first()).toBeVisible({ timeout: 15_000 });

  // Once the real content is in, the viewport should be at the top.
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 })
    .toBeLessThan(50);
}

// Stable people with deep filmographies; their top-billed (most popular) credit
// is a well-known title whose detail page streams in quickly.
const MOVIE_STAR_PATH = '/person/6193'; // Leonardo DiCaprio — top movie credits
const TV_STAR_PATH = '/person/17419'; // Bryan Cranston — top tv credits

test('navigating into a movie page from a scrolled position lands at the top', async ({ page }) => {
  await page.goto(MOVIE_STAR_PATH);
  const topMovie = page.locator('a[href^="/movie/"]').first();
  await expect(topMovie).toBeVisible({ timeout: 15_000 });

  await expectNavigationLandsAtTop(page, topMovie, /\/movie\/\d+/);
});

test('navigating into a tv page from a scrolled position lands at the top', async ({ page }) => {
  await page.goto(TV_STAR_PATH);
  const topTv = page.locator('a[href^="/tv/"]').first();
  await expect(topTv).toBeVisible({ timeout: 15_000 });

  await expectNavigationLandsAtTop(page, topTv, /\/tv\/\d+/);
});

test('navigating into a person page from a scrolled position lands at the top', async ({
  page,
}) => {
  // The movie detail page lists cast/crew, each linking to a person page.
  await page.goto(MOVIE_PATH);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await expectNavigationLandsAtTop(page, page.locator('a[href^="/person/"]').last(), /\/person\/\d+/);
});

test.describe('clamp-window viewport', () => {
  // Regression for the screen-size-dependent variant: when the destination's
  // loading skeleton is only a few dozen px taller than the viewport, the
  // browser clamps the retained scroll offset to less than the segment's
  // document offset (~80px of header + padding), the segment's top edge stays
  // visible, and Next's stock scroll handler early-exited without scrolling —
  // fossilizing the offset once the real content streamed in (fixed in
  // patches/next.patch). At 1480x864 the person skeleton (926px) leaves
  // exactly 62px of clamped scroll. Needs streaming latency to reproduce, so
  // the connection is throttled; an instant response commits URL, skeleton,
  // and content together and the bug window never opens.
  test.use({ viewport: { width: 1480, height: 864 } });

  test('navigating into a person page lands at the top when the skeleton barely exceeds the viewport', async ({
    page,
  }) => {
    // Stable long-lived show whose cast links to person pages.
    await page.goto('/tv/555');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (2000 * 1024) / 8,
      uploadThroughput: 1024 * 1024,
    });

    await expectNavigationLandsAtTop(page, page.locator('a[href^="/person/"]').last(), /\/person\/\d+/);
  });
});

test.describe('narrow viewport', () => {
  // At desktop size the person skeleton happens to fit in one viewport, so the
  // browser clamps scroll to the top even without the skeleton's height cap and
  // the test above can't regress. In the single-column mobile layout the
  // uncapped skeleton is taller than the viewport, which is where an incoming
  // navigation actually retained its scroll offset.
  test.use({ viewport: { width: 390, height: 844 } });

  test('navigating into a person page lands at the top on a small screen', async ({ page }) => {
    await page.goto(MOVIE_PATH);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await expectNavigationLandsAtTop(page, page.locator('a[href^="/person/"]').last(), /\/person\/\d+/);
  });
});
