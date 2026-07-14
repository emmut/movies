import { expect, type Page, test } from '@playwright/test';

import { signInAnonymously } from './helpers';

// Three stable TMDB movie ids with distinct titles, so the watchlist renders a
// deterministic, reorderable set of cards.
const MOVIES = [
  { id: 27205, title: 'Inception' },
  { id: 603, title: 'The Matrix' },
  { id: 157336, title: 'Interstellar' },
];

async function addToWatchlist(page: Page, movieId: number) {
  await page.goto(`/movie/${movieId}`);
  await page.getByRole('button', { name: /add to watchlist/i }).click();
  await expect(page.getByRole('button', { name: /remove from watchlist/i })).toBeEnabled();
}

/** The item card titles in DOM order within the list grid. */
function itemTitles(page: Page) {
  return page.locator('#content-container h3');
}

test.describe('reordering the watchlist', () => {
  test('moves an item with the up/down buttons and persists the order', async ({ page }) => {
    await signInAnonymously(page, '/watchlist');

    for (const movie of MOVIES) {
      await addToWatchlist(page, movie.id);
    }

    await page.goto('/watchlist');
    await page.getByRole('button', { name: /reorder items/i }).click();

    await expect(itemTitles(page)).toHaveText(['Inception', 'The Matrix', 'Interstellar']);

    // Boundary buttons are disabled.
    await expect(page.getByRole('button', { name: 'Move Inception up' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Move Interstellar down' })).toBeDisabled();

    // Move the last item up one spot; the order flips optimistically.
    await page.getByRole('button', { name: 'Move Interstellar up' }).click();
    await expect(itemTitles(page)).toHaveText(['Inception', 'Interstellar', 'The Matrix']);

    // The move must survive a full reload (server-persisted order), and the
    // buttons must be enabled again (no wedged pending state).
    await expect(page.getByRole('button', { name: 'Move Interstellar up' })).toBeEnabled();
    await page.reload();
    await page.getByRole('button', { name: /reorder items/i }).click();
    await expect(itemTitles(page)).toHaveText(['Inception', 'Interstellar', 'The Matrix']);

    // And back down to the end.
    await page.getByRole('button', { name: 'Move Interstellar down' }).click();
    await expect(itemTitles(page)).toHaveText(['Inception', 'The Matrix', 'Interstellar']);
    await page.reload();
    await page.getByRole('button', { name: /reorder items/i }).click();
    await expect(itemTitles(page)).toHaveText(['Inception', 'The Matrix', 'Interstellar']);
  });

  test('reorders items via keyboard drag-and-drop on the drag handle', async ({ page }) => {
    // A narrow viewport forces the single-column grid so ArrowDown always
    // means "one position later" regardless of responsive breakpoints.
    await page.setViewportSize({ width: 500, height: 900 });

    await signInAnonymously(page, '/watchlist');

    for (const movie of MOVIES) {
      await addToWatchlist(page, movie.id);
    }

    await page.goto('/watchlist');
    await page.getByRole('button', { name: /reorder items/i }).click();

    await expect(itemTitles(page)).toHaveText(['Inception', 'The Matrix', 'Interstellar']);

    // Lift Inception with Space, move it one slot down, drop it with Space.
    const handle = page.getByRole('button', { name: 'Reorder Inception' });
    await handle.focus();
    await page.keyboard.press('Space');
    await expect(handle).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(handle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(itemTitles(page)).toHaveText(['The Matrix', 'Inception', 'Interstellar']);
    await page.reload();
    await page.getByRole('button', { name: /reorder items/i }).click();
    await expect(itemTitles(page)).toHaveText(['The Matrix', 'Inception', 'Interstellar']);
  });
});
