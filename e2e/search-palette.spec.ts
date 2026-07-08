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
