import { expect, test } from '@playwright/test';

import { MOVIE_PATH, signInAnonymously } from './helpers';

// End-to-end coverage for the authenticated surface, exercised through a fresh
// anonymous account per test (mirrors the real "try before you sign up" flow).
// These need the local Postgres — the server actions read/write the DB — so
// they only pass with the database wired into dev/CI.

test.describe('logged-in watchlist and lists', () => {
  test('adds and removes a movie via the watchlist button', async ({ page }) => {
    await signInAnonymously(page, MOVIE_PATH);

    const addButton = page.getByRole('button', { name: /add to watchlist/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // The button flips to the "in watchlist" state optimistically.
    await expect(page.getByRole('button', { name: /remove from watchlist/i })).toBeVisible();

    // The movie now shows up on the watchlist page.
    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: /my watchlist/i })).toBeVisible();
    await expect(page.getByText(/1 movie saved/i)).toBeVisible();
    await expect(page.locator(`a[href="${MOVIE_PATH}"]`).first()).toBeVisible();

    // Remove it again from the detail page and confirm the watchlist empties.
    await page.goto(MOVIE_PATH);
    await page.getByRole('button', { name: /remove from watchlist/i }).click();
    await expect(page.getByRole('button', { name: /add to watchlist/i })).toBeVisible();

    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: /your watchlist is empty/i })).toBeVisible();
  });

  test('creates a list and adds/removes a movie through the list dropdown', async ({ page }) => {
    const listName = 'Weekend Picks';

    await signInAnonymously(page, '/lists');
    await page.goto('/lists');

    // Create a list via the dialog.
    await page.getByRole('button', { name: /create new list/i }).click();
    await page.getByLabel('Name').fill(listName);
    await page.getByRole('button', { name: 'Create List', exact: true }).click();

    const listCard = page.getByRole('link', { name: new RegExp(listName, 'i') });
    await expect(listCard).toBeVisible();
    await expect(listCard).toContainText('0 items');

    // Add the movie to the list from the detail page's list dropdown.
    await page.goto(MOVIE_PATH);
    // Exact name matches the header's list button (showWatchlist=false); the
    // cast/similar cards render "Add to list or watchlist" triggers too.
    await page.getByRole('button', { name: 'Add to list', exact: true }).click();
    await page.getByRole('menuitem', { name: new RegExp(listName, 'i') }).click();

    await page.goto('/lists');
    await expect(page.getByRole('link', { name: new RegExp(listName, 'i') })).toContainText(
      /1\s+items?/i,
    );

    // Remove it again through the same dropdown.
    await page.goto(MOVIE_PATH);
    // Exact name matches the header's list button (showWatchlist=false); the
    // cast/similar cards render "Add to list or watchlist" triggers too.
    await page.getByRole('button', { name: 'Add to list', exact: true }).click();
    await page.getByRole('menuitem', { name: new RegExp(listName, 'i') }).click();

    await page.goto('/lists');
    await expect(page.getByRole('link', { name: new RegExp(listName, 'i') })).toContainText(
      '0 items',
    );
  });

  test('toggles the watchlist from a card list dropdown', async ({ page }) => {
    await signInAnonymously(page, MOVIE_PATH);

    // Seed one watchlist item so the watchlist page renders exactly one card.
    await page.goto(MOVIE_PATH);
    await page.getByRole('button', { name: /add to watchlist/i }).click();
    await expect(page.getByRole('button', { name: /remove from watchlist/i })).toBeVisible();

    await page.goto('/watchlist');
    const card = page.locator(`a[href="${MOVIE_PATH}"]`).first();
    await expect(card).toBeVisible();

    // Open the card's list dropdown and use its watchlist toggle to remove it.
    await page.getByRole('button', { name: /add to list or watchlist/i }).click();
    await page.getByRole('menuitem', { name: /remove from watchlist/i }).click();

    // Reload for a deterministic server render and confirm the card is gone.
    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: /your watchlist is empty/i })).toBeVisible();
    await expect(page.locator(`a[href="${MOVIE_PATH}"]`)).toHaveCount(0);
  });
});
