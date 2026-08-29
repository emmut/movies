import { expect, test } from '@playwright/test';

import { MOVIE_PATH } from './helpers';

// Regression: navigating from a scrolled-down position into a route with a
// loading.tsx boundary showed the skeleton still scrolled down, then visibly
// jumped to the top only once the real content streamed in.
//
// Next assigns the navigation's scroll intent to the new leaf CacheNode, whose
// scroll handler lives inside the segment's still-pending RSC payload — so
// nothing scrolled while the skeleton was on screen (fixed in
// patches/next.patch by running the scroll handler over the loading fallback).
// This pins the invariant: the viewport is at the top WHILE the skeleton is
// still visible, not merely after the content replaces it.
//
// Needs streaming latency: an instant response commits URL, skeleton, and
// content together and the skeleton window never opens, so the connection is
// throttled via CDP (which is why this runs under chromium only). The
// throttle must not start until the sidebar Link has prefetched the discover
// shell — an unprefetched shell commits skeleton and content in one go and
// the window never opens either.

type Sample = { y: number; path: string; routeSkeleton: boolean };

declare global {
  interface Window {
    __samples?: Sample[];
    __sampleTimer?: ReturnType<typeof setInterval>;
  }
}

test('the loading skeleton is shown at the top when navigating from a scrolled position', async ({
  page,
}) => {
  // The sidebar Link prefetches the discover shell during initial load. Wait
  // for that prefetch directly — a response from the discover route, armed
  // before the load so it can't be missed — and then for the network to
  // drain, so throttling can't start before the shell is cached. An
  // unprefetched shell commits skeleton and content together and the skeleton
  // window never opens.
  // Only the sidebar link's plain /discover prefetch may satisfy the wait:
  // exact pathname (not a genre page's /discover/…) and no query params
  // beyond Next's own _rsc cache-buster (not a query-parameterized
  // /discover?genreId=…).
  const discoverPrefetched = page.waitForResponse(
    (res) => {
      const url = new URL(res.url());
      return (
        url.pathname === '/discover' &&
        [...url.searchParams.keys()].every((key) => key === '_rsc')
      );
    },
    { timeout: 15_000 },
  );
  await page.goto(MOVIE_PATH);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await discoverPrefetched;
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);

  const client = await page.context().newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (2000 * 1024) / 8,
    uploadThroughput: 1024 * 1024,
  });

  // A soft navigation keeps the JS context, so a sampler started before the
  // click keeps recording through it — no external polling cadence to race
  // the skeleton window. The real discover content also shows client-query
  // skeletons in its grid, so "route still loading" additionally requires the
  // content's `#content` container to be absent. Hidden bfcache segments keep
  // old nodes in the DOM, so only visible elements count.
  await page.evaluate(() => {
    window.__samples = [];
    window.__sampleTimer = setInterval(() => {
      window.__samples?.push({
        y: Math.round(window.scrollY),
        path: location.pathname,
        routeSkeleton:
          Array.from(document.querySelectorAll('[data-slot="skeleton"]')).some((el) =>
            el.checkVisibility(),
          ) && !document.querySelector('#content')?.checkVisibility(),
      });
    }, 25);
  });

  // The sidebar is fixed, so its Discover link is clickable while scrolled.
  await page.getByRole('link', { name: 'Discover' }).click();
  await page.waitForURL(/\/discover/);
  await expect(page.locator('#content')).toBeVisible({ timeout: 15_000 });

  const samples = await page.evaluate(() => {
    clearInterval(window.__sampleTimer);
    return window.__samples ?? [];
  });
  const skeletonSamples = samples.filter((s) => s.path.startsWith('/discover') && s.routeSkeleton);

  // The skeleton phase was observed at all (otherwise the test proved
  // nothing) and never while scrolled down.
  expect(skeletonSamples.length).toBeGreaterThan(0);
  expect(skeletonSamples.every((s) => s.y < 50)).toBe(true);

  // And it stays at the top once the real content has replaced the skeleton.
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeLessThan(50);
});
