import { expect, test } from '@playwright/test';

// Auth-gated routes must bounce anonymous users to /login. This is the highest
// value e2e check: it exercises the server-component auth guard end to end.

test('watchlist redirects anonymous users to login', async ({ page }) => {
  await page.goto('/watchlist');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
});

test('lists redirects anonymous users to login', async ({ page }) => {
  await page.goto('/lists');
  await expect(page).toHaveURL(/\/login/);
});

test('settings redirects anonymous users to login', async ({ page }) => {
  await page.goto('/settings');
  await expect(page).toHaveURL(/\/login/);
});
