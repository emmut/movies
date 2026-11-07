import { expect, type Page, test } from '@playwright/test';

import { keyboardMoveRight, signInAnonymously } from './helpers';

// Three stable TMDB movie ids with distinct titles, so the list renders a
// deterministic, reorderable set of cards.
const MOVIES = [
  { id: 27205, title: 'Inception' },
  { id: 603, title: 'The Matrix' },
  { id: 157336, title: 'Interstellar' },
];

async function createList(page: Page, name: string) {
  await page.getByRole('button', { name: /create new list/i }).click();
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Create List', exact: true }).click();
  await expect(page.getByRole('link', { name: new RegExp(name, 'i') })).toBeVisible({ timeout: 15_000 });
}

async function addToCustomList(page: Page, moviePath: string, listName: string) {
  await page.goto(moviePath);
  await page.getByRole('button', { name: 'Add to list', exact: true }).click();
  await page.getByRole('menuitem', { name: new RegExp(listName, 'i') }).click();
  await expect(page.getByText(`Added to "${listName}"`)).toBeVisible({ timeout: 15_000 });
}

/**
 * The visible item card titles in DOM order within the list details grid.
 * Next.js keeps previously visited segments mounted but hidden
 * (`display: none`), so an unscoped `#content h3` also matches the
 * cached /lists page's card titles after client-side navigation.
 */
function itemTitles(page: Page) {
  return page.locator('#content h3:visible');
}

test.describe('reordering list items', () => {
  test('moves an item with the up/down buttons and persists the order', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await signInAnonymously(page, '/lists');
    await page.goto('/lists');

    const listName = 'A long weekend watchlist to share with friends';
    await createList(page, listName);
    for (const movie of MOVIES) {
      await addToCustomList(page, `/movie/${movie.id}`, listName);
    }

    await page.goto('/lists');
    await page.getByRole('link', { name: new RegExp(listName, 'i') }).click();
    await page.setViewportSize({ width: 320, height: 844 });
    const header = page.locator('[data-slot="list-header-row"]');
    for (const name of ['Reorder items', 'Edit List', 'Delete List']) {
      const action = header.getByRole('button', { name, exact: true });
      await expect(action).toBeVisible();
      const bounds = (await action.boundingBox())!;
      expect(bounds.width).toBe(44);
      expect(bounds.height).toBe(44);
    }
    const headerLayout = await header.evaluate((element) => {
      const title = element.querySelector('h2')!.getBoundingClientRect();
      const actions = [...element.querySelectorAll('button')].map((button) =>
        button.getBoundingClientRect(),
      );
      return {
        titleWidth: title.width,
        headerWidth: element.getBoundingClientRect().width,
        titleBottom: title.bottom,
        actionTops: actions.map((action) => action.top),
      };
    });
    expect(headerLayout.titleWidth).toBeCloseTo(headerLayout.headerWidth, 0);
    expect(Math.min(...headerLayout.actionTops)).toBeGreaterThan(headerLayout.titleBottom);
    expect(Math.max(...headerLayout.actionTops) - Math.min(...headerLayout.actionTops)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await header.getByRole('button', { name: 'Edit List', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Edit List', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await header.getByRole('button', { name: 'Delete List', exact: true }).click();
    await expect(page.getByRole('alertdialog', { name: 'Delete List', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('custom-list-mobile.png'), animations: 'disabled', style: 'nextjs-portal { display: none !important; }' });
    await page.getByRole('button', { name: /reorder items/i }).click();

    await expect(itemTitles(page)).toHaveText([
      'Inception',
      'The Matrix',
      'Interstellar',
    ]);

    // Boundary buttons are disabled.
    await expect(page.getByRole('button', { name: 'Move Inception up' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Move Interstellar down' })).toBeDisabled();

    // Move the last item up one spot; the order flips optimistically.
    await page.getByRole('button', { name: 'Move Interstellar up' }).click();
    await expect(itemTitles(page)).toHaveText([
      'Inception',
      'Interstellar',
      'The Matrix',
    ]);

    // The move must survive a full reload (server-persisted order), and the
    // buttons must be enabled again (no wedged pending state).
    await expect(page.getByRole('button', { name: 'Move Interstellar up' })).toBeEnabled();
    await page.reload();
    await page.getByRole('button', { name: /reorder items/i }).click();
    await expect(itemTitles(page)).toHaveText([
      'Inception',
      'Interstellar',
      'The Matrix',
    ]);

    // And back down to the end.
    await page.getByRole('button', { name: 'Move Interstellar down' }).click();
    await expect(itemTitles(page)).toHaveText([
      'Inception',
      'The Matrix',
      'Interstellar',
    ]);
    await page.reload();
    await page.getByRole('button', { name: /reorder items/i }).click();
    await expect(itemTitles(page)).toHaveText([
      'Inception',
      'The Matrix',
      'Interstellar',
    ]);
  });

  test('reorders items via keyboard drag-and-drop on the drag handle', async ({ page }) => {
    await signInAnonymously(page, '/lists');
    await page.goto('/lists');

    await createList(page, 'Reorderables');
    for (const movie of MOVIES) {
      await addToCustomList(page, `/movie/${movie.id}`, 'Reorderables');
    }

    await page.goto('/lists');
    await page.getByRole('link', { name: /reorderables/i }).click();
    await page.getByRole('button', { name: /reorder items/i }).click();

    await expect(itemTitles(page)).toHaveText([
      'Inception',
      'The Matrix',
      'Interstellar',
    ]);

    // Lift Inception with Space, move it one slot later, drop it with Space.
    // ArrowRight targets the next card in the row-major grid at every
    // breakpoint (the grid is never single-column, so ArrowDown would jump a
    // whole row). dnd-kit reflects the lifted state via aria-pressed on the
    // handle, and keyboardMoveRight waits for the move to commit, so each
    // step is observable instead of racing raw key presses.
    const handle = page.getByRole('button', { name: 'Reorder Inception' });
    await handle.focus();
    await page.keyboard.press('Space');
    await expect(handle).toHaveAttribute('aria-pressed', 'true');
    await keyboardMoveRight(page, 'The Matrix');
    await page.keyboard.press('Space');
    await expect(handle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(itemTitles(page)).toHaveText([
      'The Matrix',
      'Inception',
      'Interstellar',
    ]);
    await page.reload();
    await page.getByRole('button', { name: /reorder items/i }).click();
    await expect(itemTitles(page)).toHaveText([
      'The Matrix',
      'Inception',
      'Interstellar',
    ]);
  });
});
