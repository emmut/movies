import { expect, test } from '@playwright/test';

import { signInAnonymously } from './helpers';

const MOVIE_ID = 27205;
const MOVIE_PATH = `/movie/${MOVIE_ID}`;

test.describe('remove from list confirmation', () => {
  test('shows confirmation dialog before removing item from list', async ({ page }) => {
    await signInAnonymously(page, '/lists');
    await page.goto('/lists');

    const listName = 'Confirmation Test List';

    await page.getByRole('button', { name: /create new list/i }).click();
    await page.getByLabel('Name').fill(listName);
    await page.getByRole('button', { name: 'Create List', exact: true }).click();

    await expect(page.getByRole('link', { name: new RegExp(listName, 'i') })).toBeVisible();

    await page.goto(MOVIE_PATH);
    await page.getByRole('button', { name: 'Add to list', exact: true }).click();
    await page.getByRole('menuitem', { name: new RegExp(listName, 'i') }).click();
    await expect(page.getByText(`Added to "${listName}"`)).toBeVisible();

    await page.goto('/lists');
    await page.getByRole('link', { name: new RegExp(listName, 'i') }).click();

    const itemCard = page.locator(`a[href="${MOVIE_PATH}"]`).first();
    await expect(itemCard).toBeVisible();

    const removeButton = itemCard.locator('..').getByRole('button', { name: /remove from list/i });
    await expect(removeButton).toBeVisible();
    await removeButton.click();

    const dialog = page.getByRole('dialog', { name: /remove from list/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('This will remove the item from your list. This action cannot be undone.')).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(itemCard).toBeVisible();

    await removeButton.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Remove' }).click();

    await expect(page.getByText('Removed from list')).toBeVisible();
    await expect(itemCard).not.toBeVisible();
  });

  test('confirmation dialog is accessible with proper ARIA attributes', async ({ page }) => {
    await signInAnonymously(page, '/lists');
    await page.goto('/lists');

    const listName = 'A11y Test List';

    await page.getByRole('button', { name: /create new list/i }).click();
    await page.getByLabel('Name').fill(listName);
    await page.getByRole('button', { name: 'Create List', exact: true }).click();

    await page.goto(MOVIE_PATH);
    await page.getByRole('button', { name: 'Add to list', exact: true }).click();
    await page.getByRole('menuitem', { name: new RegExp(listName, 'i') }).click();
    await expect(page.getByText(`Added to "${listName}"`)).toBeVisible();

    await page.goto('/lists');
    await page.getByRole('link', { name: new RegExp(listName, 'i') }).click();

    const itemCard = page.locator(`a[href="${MOVIE_PATH}"]`).first();
    const removeButton = itemCard.locator('..').getByRole('button', { name: /remove from list/i });
    await removeButton.click();

    const dialog = page.getByRole('dialog', { name: /remove from list/i });
    await expect(dialog).toBeVisible();

    const title = dialog.getByRole('heading', { name: /remove from list/i });
    await expect(title).toBeVisible();

    const description = dialog.getByText('This will remove the item from your list. This action cannot be undone.');
    await expect(description).toBeVisible();

    const cancelButton = dialog.getByRole('button', { name: 'Cancel' });
    const removeButtonInDialog = dialog.getByRole('button', { name: 'Remove' });
    await expect(cancelButton).toBeVisible();
    await expect(removeButtonInDialog).toBeVisible();
  });
});