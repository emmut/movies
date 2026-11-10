import { expect, test } from '@playwright/test';

import { signInAnonymously } from './helpers';

test('collapsed sidebar tooltips open without advancing browser time', async ({ page }) => {
  await page.goto('/login');
  await page.locator('header').getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
  await expect(page.locator('[data-slot="sidebar-container"]')).toHaveCSS('width', '48px');

  const brand = page.getByRole('link', { name: 'Movies home' });
  await expect(brand).toBeVisible();
  const start = new Date('2026-01-01T00:00:00Z');
  const pausedAt = new Date(start.getTime() + 1000);
  await page.clock.install({ time: start });
  await page.clock.pauseAt(pausedAt);

  // Skip animation-frame actionability checks while the clock is paused.
  // A nonzero tooltip delay cannot expire, even during assertion retries.
  await brand.hover({ force: true });
  await expect(page.locator('[data-slot="tooltip-content"][data-open]')).toHaveText('Movies');
  expect(await page.evaluate(() => Date.now())).toBe(pausedAt.getTime());
});

test('desktop sidebar collapses to usable icons and expands with the keyboard', async ({ page }) => {
  await page.goto('/login');
  const sidebar = page.locator('[data-slot="sidebar"][data-state]');
  const discover = sidebar.getByRole('link', { name: 'Discover', exact: true });
  await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  await expect(sidebar.getByText('Browse', { exact: true })).toBeVisible();
  await discover.hover();
  await expect(page.locator('[data-slot="tooltip-content"][data-open]')).not.toBeVisible();
  await page.locator('header').getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
  await expect(sidebar).toHaveAttribute('data-collapsible', 'icon');
  await expect(page.locator('[data-slot="sidebar-container"]')).toHaveCSS('width', '48px');
  await expect(discover).toBeVisible();
  await sidebar.getByRole('link', { name: 'Movies home' }).hover();
  await expect(page.locator('[data-slot="tooltip-content"][data-open]')).toHaveText('Movies');
  await discover.hover();
  await expect(page.locator('[data-slot="tooltip-content"][data-open]')).toHaveText('Discover');
  await page.keyboard.press('Control+b');
  await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  await expect(page.locator('[data-slot="tooltip-content"][data-open]')).not.toBeVisible();
  await expect(page.locator('[data-slot="sidebar-container"]')).toHaveCSS('width', '256px');
  await expect(sidebar.getByRole('link', { name: 'Movies home' })).toBeVisible();
});

test('mobile sidebar keeps full labels and closes after navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await page.locator('header').getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
  const sidebar = page.getByRole('dialog', { name: 'Sidebar', exact: true });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByText('Browse', { exact: true })).toBeVisible();
  await expect(sidebar.getByText('Your movie library', { exact: true })).toBeVisible();
  await sidebar.getByRole('link', { name: 'Discover', exact: true }).hover();
  await expect(page.locator('[data-slot="tooltip-content"][data-open]')).not.toBeVisible();
  await sidebar.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(sidebar).not.toBeVisible();
  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
});

test('library navigation and account menu remain usable in the icon rail', async ({ page }) => {
  await signInAnonymously(page, '/watchlist');
  const sidebar = page.locator('[data-slot="sidebar"][data-state]');
  await expect(sidebar.getByRole('navigation', { name: 'Library' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Watchlist', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.locator('header').getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
  await expect(page.locator('[data-slot="sidebar-container"]')).toHaveCSS('width', '48px');
  for (const label of ['Watchlist', 'Watched', 'Lists']) {
    await sidebar.getByRole('link', { name: label, exact: true }).hover();
    await expect(page.locator('[data-slot="tooltip-content"][data-open]')).toHaveText(label);
  }
  const account = sidebar.getByRole('button', { name: /Account for/ });
  await account.focus();
  await account.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Log out' })).toBeVisible();
});
