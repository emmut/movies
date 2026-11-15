import { expect, test } from '@playwright/test';

import { signInAnonymously } from './helpers';

test('keeps the provider filter open while filtering a custom list', async ({ page }) => {
  const listName = 'Provider Picks';

  await signInAnonymously(page, '/lists');
  await page.goto('/lists');

  await page.getByRole('button', { name: /create new list/i }).click();
  await page.getByLabel('Name').fill(listName);
  await page.getByRole('button', { name: 'Create List', exact: true }).click();
  const listCard = page.getByRole('link', { name: new RegExp(listName, 'i') });
  await expect(listCard).toBeVisible({ timeout: 15_000 });
  // Creating the list refreshes the overview; enter the committed URL so that
  // refresh cannot interrupt the filtering test's setup navigation.
  await page.goto((await listCard.getAttribute('href'))!);

  const listDetails = page.locator('[data-slot="list-details"]').filter({ visible: true });
  await expect(listDetails).toHaveAttribute('aria-busy', 'false');

  let release = () => {};
  const responseGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/rpc/customLists/details*', async (route) => {
    await responseGate;
    await route.continue();
  });

  await page.getByRole('button', { name: /^providers$/i }).click();
  const popover = page.locator('[data-slot="popover-content"]').filter({ visible: true });
  const provider = popover.getByRole('button').filter({ hasNotText: /clear all/i }).first();

  try {
    await expect(provider).toBeVisible();
    await Promise.all([
      page.waitForRequest('**/api/rpc/customLists/details*'),
      provider.click(),
    ]);

    await expect(page).toHaveURL(/with_watch_providers=/);
    await expect(listDetails).toHaveAttribute('aria-busy', 'true');
    await expect(popover).toBeVisible();
  } finally {
    release();
  }
  await expect(listDetails).toHaveAttribute('aria-busy', 'false');
  await expect(popover).toBeVisible();
  await expect(popover.getByRole('button', { name: /clear all/i })).toBeVisible();
});
