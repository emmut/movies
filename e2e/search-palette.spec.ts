import { expect, test } from '@playwright/test';

// Coverage for the ⌘K search palette. Content assertions stay generic (TMDB
// results change daily) — these check the palette mechanics themselves.

test('search palette opens from the header and shows results', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /search/i }).click();

  const input = page.getByRole('searchbox', { name: /search for movies/i });
  await expect(input).toBeVisible();
  await input.fill('star');

  const rows = page.getByLabel('Search results').locator('li');
  await expect(rows.first()).toBeVisible({ timeout: 15_000 });
});

// Regression: with keepPreviousData, the previous query's rows stay rendered
// while a new query is debouncing/fetching. They are dimmed and must also be
// inert — clicking one used to route to the previous query's result.
test('stale rows are not clickable while a new query is pending', async ({ page }) => {
  await page.goto('/');

  // Widen the stale window deterministically by slowing server actions down.
  await page.route('**', async (route) => {
    if (route.request().method() === 'POST') {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    await route.continue();
  });

  await page.getByRole('button', { name: /search/i }).click();
  const input = page.getByRole('searchbox', { name: /search for movies/i });
  await input.fill('star');

  const list = page.getByLabel('Search results');
  await expect(list.locator('li').first()).toBeVisible({ timeout: 15_000 });

  // New query; old rows are still on screen while it fetches.
  await input.fill('batman');
  const urlBefore = page.url();

  // Real mouse click so browser hit-testing applies pointer-events.
  const box = await list.locator('li').first().boundingBox();
  if (!box) throw new Error('expected a visible stale row');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  await page.waitForTimeout(400);
  expect(page.url()).toBe(urlBefore);
  await expect(input).toBeVisible(); // palette still open, nothing navigated
});

// Regression: the results list scrolls (max-h + overflow-y), and arrowing past
// the fold used to move the selection out of view. The active row must be
// scrolled into view as the selection moves.
test('palette keeps the keyboard-selected row in view while arrowing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /search/i }).click();

  const input = page.getByRole('searchbox', { name: /search for movies/i });
  await input.fill('star');

  const list = page.getByLabel('Search results');
  await expect(list.locator('li').first()).toBeVisible({ timeout: 15_000 });

  // The first row starts selected; walk the selection to the last row, then
  // wrap back to the top. The active row must stay visible the whole way.
  const rowCount = await list.locator('li').count();
  const active = list.locator('a[aria-current="true"]');

  for (let step = 0; step < rowCount - 1; step++) {
    await input.press('ArrowDown');
  }
  await expect(active).toBeInViewport();

  await input.press('ArrowDown'); // wraps to the first row
  await expect(active).toBeInViewport();
});
