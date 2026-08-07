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
