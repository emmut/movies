import { expect, test } from '@playwright/test';

// Smoke coverage for the public surface: pages render, navigation works, and
// the search box is wired up. These don't assert on TMDB content (which changes
// daily) — only on the app shell rendering without server errors.

test('home page renders the app shell', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  // A nav landmark is present on every page via the root layout.
  await expect(page.locator('nav').first()).toBeVisible();
});

test('login page renders the welcome heading', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
});

test('search page exposes a search input and accepts a query', async ({ page }) => {
  await page.goto('/search');
  const searchBox = page.getByRole('searchbox').or(page.getByRole('textbox')).first();
  await expect(searchBox).toBeVisible();
  await searchBox.fill('matrix');
  // Query is reflected into the URL (nuqs) so results can be deep-linked.
  await expect(page).toHaveURL(/q=matrix/i, { timeout: 10_000 });
});
