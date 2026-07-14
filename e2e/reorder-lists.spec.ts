import { expect, type Page, test } from '@playwright/test';

import { signInAnonymously } from './helpers';

// End-to-end coverage for manual list reordering on /lists, through both
// mechanisms: the explicit move up/down buttons and dnd-kit's keyboard
// drag-and-drop (lift with Space, move with arrows, drop with Space).

async function createList(page: Page, name: string) {
  await page.getByRole('button', { name: /create new list/i }).click();
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Create List', exact: true }).click();
  await expect(page.getByRole('link', { name: new RegExp(name, 'i') })).toBeVisible();
}

/** The list card titles in DOM order. */
function cardTitles(page: Page) {
  return page.locator('#content-container h3');
}

test.describe('reordering lists', () => {
  test('moves a list with the up/down buttons and persists the order', async ({ page }) => {
    await signInAnonymously(page, '/lists');
    await page.goto('/lists');

    // New lists append to the end of the manual ordering.
    await createList(page, 'Alpha One');
    await createList(page, 'Bravo Two');
    await createList(page, 'Charlie Three');
    await expect(cardTitles(page)).toHaveText(['Alpha One', 'Bravo Two', 'Charlie Three']);

    // Boundary buttons are disabled.
    await expect(page.getByRole('button', { name: 'Move Alpha One up' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Move Charlie Three down' })).toBeDisabled();

    // Move the last list up one spot; the order flips optimistically.
    await page.getByRole('button', { name: 'Move Charlie Three up' }).click();
    await expect(cardTitles(page)).toHaveText(['Alpha One', 'Charlie Three', 'Bravo Two']);

    // The move must survive a full reload (server-persisted order), and the
    // buttons must be enabled again (no wedged pending state).
    await expect(page.getByRole('button', { name: 'Move Charlie Three up' })).toBeEnabled();
    await page.reload();
    await expect(cardTitles(page)).toHaveText(['Alpha One', 'Charlie Three', 'Bravo Two']);

    // And back down to the end.
    await page.getByRole('button', { name: 'Move Charlie Three down' }).click();
    await expect(cardTitles(page)).toHaveText(['Alpha One', 'Bravo Two', 'Charlie Three']);
    await page.reload();
    await expect(cardTitles(page)).toHaveText(['Alpha One', 'Bravo Two', 'Charlie Three']);
  });

  test('reorders via keyboard drag-and-drop on the drag handle', async ({ page }) => {
    // A narrow viewport forces the single-column grid so ArrowDown always
    // means "one position later" regardless of responsive breakpoints.
    await page.setViewportSize({ width: 500, height: 900 });

    await signInAnonymously(page, '/lists');
    await page.goto('/lists');

    await createList(page, 'Alpha One');
    await createList(page, 'Bravo Two');
    await expect(cardTitles(page)).toHaveText(['Alpha One', 'Bravo Two']);

    // Lift Alpha with Space, move it one slot down, drop it with Space.
    // dnd-kit reflects the lifted state via aria-pressed on the handle, which
    // makes each step observable instead of racing raw key presses.
    const handle = page.getByRole('button', { name: 'Reorder Alpha One' });
    await handle.focus();
    await page.keyboard.press('Space');
    await expect(handle).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(handle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(cardTitles(page)).toHaveText(['Bravo Two', 'Alpha One']);
    await page.reload();
    await expect(cardTitles(page)).toHaveText(['Bravo Two', 'Alpha One']);
  });
});
