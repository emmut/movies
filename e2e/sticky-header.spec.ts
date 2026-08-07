import { expect, type Page, test } from '@playwright/test';

import { MOVIE_PATH } from './helpers';

// The root layout's header (sidebar trigger + search) is sticky. Three things
// have to hold, and all three are invisible on a page short enough not to
// scroll — hence the explicit long-page routes below.
//
// 1. It actually sticks. `position: sticky` resolves against the nearest
//    scrolling ancestor, and the header's parent (`SidebarInset`) sets
//    `overflow-x`. With `hidden` that parent becomes a scroll container which
//    never scrolls, and the header silently rides the page instead of pinning
//    — it looks fine at the top of the page and only breaks once you scroll.
//    `overflow-x-clip` keeps the viewport as the scrollport.
// 2. Nothing lands behind it. `scroll-padding-top` on the root reserves its
//    height, so anchor jumps and `scrollIntoView` stop below the header.
// 3. It stays usable. Pinned but non-interactive (a stacking-order slip against
//    the sidebar or page content) would be the same bug from the user's side.
//
// This runs under both projects — desktop Chromium and WebKit on an iPhone
// viewport — because sticky positioning and scroll-anchoring are exactly where
// mobile Safari has historically diverged.

/** The sticky header's viewport rect, or null if it isn't rendered. */
function headerRect(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) {
      return null;
    }

    const { top, height } = header.getBoundingClientRect();
    return { top: Math.round(top), height: Math.round(height) };
  });
}

/** Scrolls to the bottom of the document without smooth-scroll animation. */
async function scrollToBottom(page: Page) {
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
  );
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
}

test('the header stays pinned to the top of the viewport while scrolling', async ({ page }) => {
  // Discover is reliably taller than any viewport we test at.
  await page.goto('/discover');
  await expect(page.locator('#content a[href^="/movie/"]').first()).toBeVisible({
    timeout: 20_000,
  });

  const atRest = await headerRect(page);
  expect(atRest).not.toBeNull();
  expect(atRest!.top).toBe(0);
  expect(atRest!.height).toBeGreaterThan(0);

  await scrollToBottom(page);

  // The whole point: still at the top of the viewport, same height. A header
  // that scrolled away would report a large negative `top`.
  const afterScroll = await headerRect(page);
  expect(afterScroll).toEqual(atRest);
});

test('the header stays pinned on a detail page', async ({ page }) => {
  // Detail routes stream in behind a loading skeleton, so the header is sticky
  // across a content swap rather than a single static render.
  await page.goto(MOVIE_PATH);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

  await scrollToBottom(page);

  const rect = await headerRect(page);
  expect(rect).not.toBeNull();
  expect(rect!.top).toBe(0);
});

test('the search trigger stays clickable once the page is scrolled', async ({ page }) => {
  await page.goto('/discover');
  const searchTrigger = page.getByRole('button', { name: /search/i }).first();
  await expect(searchTrigger).toBeVisible({ timeout: 20_000 });

  await scrollToBottom(page);

  // Not `force: true` — an ordinary click fails if anything overlaps the
  // header, which is precisely the stacking-order regression worth catching.
  await searchTrigger.click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
});

test('the sidebar trigger stays clickable once the page is scrolled', async ({ page }) => {
  await page.goto('/discover');
  await expect(page.locator('#content a[href^="/movie/"]').first()).toBeVisible({
    timeout: 20_000,
  });

  await scrollToBottom(page);

  const sidebarTrigger = page.getByRole('button', { name: /toggle sidebar/i }).first();
  await expect(sidebarTrigger).toBeVisible();
  await sidebarTrigger.click();
  await expect(page.locator('nav').first()).toBeVisible();
});

test('page content scrolls behind the header, never over it', async ({ page }) => {
  // Regression: cards decorate themselves with z-index (the trending card's
  // title overlay is z-10, sortable cards' drag badges z-20). With no stacking
  // context between them and the header, those competed with the header's own
  // z-index directly and won on DOM order — titles rendered straight through
  // the header while scrolling. Home is the page that showed it: its trending
  // cards sit at the top, so they pass under the header immediately.
  await page.goto('/');
  const overlayTitle = page.locator('a[href^="/movie/"] h2, a[href^="/tv/"] h2').first();
  await expect(overlayTitle).toBeVisible({ timeout: 20_000 });

  // Scan the page rather than parking at one offset. Different things cross the
  // header at different scroll positions — trending titles near the top, the
  // sliders' arrows and edge fades further down — and hit-testing a single spot
  // only ever catches whatever happened to be there. `elementFromPoint` also
  // reports fully transparent elements, so this catches an invisible control
  // sitting over the header, not just a visible one.
  const leaks = await page.evaluate(() => {
    const header = document.querySelector('header')!;
    const found: { scrollY: number; hit: string }[] = [];
    // Step size decides what this can catch, and the margin is not generous: a
    // card's title strip is only ~40px tall, so it is inside the header's band
    // for a correspondingly short run of scroll offsets. Measured against a
    // deliberately broken build, 100px caught only the slider arrows, 60px
    // added the year line, and 24px was the first that caught the card title
    // itself — the element that actually regressed. Keep it small.
    const STEP = 24;

    for (let top = 0; top < document.body.scrollHeight; top += STEP) {
      window.scrollTo({ top, behavior: 'instant' });
      const rect = header.getBoundingClientRect();
      const y = Math.round(rect.top + rect.height / 2);

      // Sample across the header's own box, not the window's. On desktop the
      // sidebar occupies the left of the viewport, and it is *supposed* to be
      // topmost there — it is fixed at z-10 and forms its own stacking context.
      for (const fraction of [0.05, 0.25, 0.5, 0.75, 0.95]) {
        const x = Math.round(rect.left + rect.width * fraction);
        const hit = document.elementFromPoint(x, y);
        if (hit && !header.contains(hit)) {
          found.push({
            scrollY: Math.round(window.scrollY),
            hit: `${hit.tagName.toLowerCase()}.${String(hit.className).split(' ').slice(0, 3).join('.')}`,
          });
        }
      }
    }

    return found;
  });

  expect(leaks).toEqual([]);
});

test('the page never scrolls horizontally', async ({ page }) => {
  // Regression from making the header sticky. `SidebarInset` had to move from
  // `overflow-x: hidden` to `clip` so it stops being a scroll container and the
  // header sticks to the viewport. But a flex item's `min-width: auto` resolves
  // to its min-content width *except* on scroll containers, where it resolves
  // to 0 — so `hidden` had been making the inset shrink correctly for free.
  // Under `clip` it refused to shrink past its content and pushed the desktop
  // layout 96px wider than the viewport. `min-w-0` restores it.
  //
  // Nothing else here would catch that: the header still pinned, still took
  // clicks, and nothing painted over it. It was only visible as a horizontal
  // scrollbar and captions running off the right edge.
  for (const path of ['/', '/discover']) {
    await page.goto(path);
    await expect(page.locator('header')).toBeVisible({ timeout: 20_000 });

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    // Sub-pixel rounding can add a stray pixel; anything beyond that is real.
    expect(scrollWidth, `${path} overflows horizontally`).toBeLessThanOrEqual(clientWidth + 1);
  }
});

test('the skip link lands the content below the header, not behind it', async ({ page }) => {
  await page.goto('/discover');
  await expect(page.locator('#content a[href^="/movie/"]').first()).toBeVisible({
    timeout: 20_000,
  });

  // The skip link is visually hidden until focused; Tab from the document start
  // reaches it the way a keyboard user would.
  const skipLink = page.getByRole('link', { name: /skip to content/i });
  await skipLink.focus();
  await skipLink.press('Enter');

  const header = await headerRect(page);
  const contentTop = await page.evaluate(() =>
    Math.round(document.getElementById('content')!.getBoundingClientRect().top),
  );

  // Below the header (the regression is `contentTop < header.height`, i.e. the
  // first row of results hidden underneath it) and still near the top.
  expect(contentTop).toBeGreaterThanOrEqual(header!.height);
  expect(contentTop).toBeLessThan(header!.height + 80);
});
