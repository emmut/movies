import { expect, test } from '@playwright/test';

import { signInAnonymously } from './helpers';

test('desktop sidebar collapses to usable icons and expands with the keyboard', async ({ page }) => {
  await page.goto('/login');
  const sidebar = page.locator('[data-slot="sidebar"][data-state]');
  const discover = sidebar.getByRole('link', { name: 'Discover', exact: true });
  await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  await expect(sidebar.getByText('Browse', { exact: true })).toBeVisible();
  await page.locator('header').getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
  await expect(sidebar).toHaveAttribute('data-collapsible', 'icon');
  await expect(page.locator('[data-slot="sidebar-container"]')).toHaveCSS('width', '48px');
  await expect(discover).toBeVisible();
  await discover.hover();
  await expect(page.locator('[data-slot="tooltip-content"]')).toHaveText('Discover');
  await page.keyboard.press('Control+b');
  await expect(sidebar).toHaveAttribute('data-state', 'expanded');
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
  const account = sidebar.getByRole('button', { name: /Account for/ });
  await account.focus();
  await account.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Log out' })).toBeVisible();
});
