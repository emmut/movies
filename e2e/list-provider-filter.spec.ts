import { expect, test } from '@playwright/test';

import { signInAnonymously } from './helpers';

test('keeps the provider filter open while filtering a custom list', async ({ page }) => {
  const listName = 'Provider Picks';

  await signInAnonymously(page, '/lists');
  await page.goto('/lists');

  await page.getByRole('button', { name: /create new list/i }).click();
  await page.getByLabel('Name').fill(listName);
  await page.getByRole('button', { name: 'Create List', exact: true }).click();
  await page.getByRole('link', { name: new RegExp(listName, 'i') }).click();

  const listDetails = page.locator('[data-slot="list-details"]');
  await expect(listDetails).toHaveAttribute('aria-busy', 'false');

  await page.route('**/lists/**', async (route) => {
    if (route.request().method() === 'POST') {
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    await route.continue();
  });

  await page.getByRole('button', { name: /^providers$/i }).click();
  const popover = page.locator('[data-slot="popover-content"]');
  const provider = popover.getByRole('button').filter({ hasNotText: /clear all/i }).first();

  await expect(provider).toBeVisible();
  await provider.click();

  await expect(page).toHaveURL(/with_watch_providers=/);
  await expect(listDetails).toHaveAttribute('aria-busy', 'true');
  await expect(listDetails).toHaveAttribute('aria-busy', 'false');
  await expect(popover).toBeVisible();
  await expect(popover.getByRole('button', { name: /clear all/i })).toBeVisible();
});
