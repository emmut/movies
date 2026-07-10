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

    // The label flips optimistically, but the button stays disabled until the
    // server action commits — wait for enabled so /watchlist sees the row.
    await expect(page.getByRole('button', { name: /remove from watchlist/i })).toBeEnabled();

    // The movie now shows up on the watchlist page.
    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: /my watchlist/i })).toBeVisible();
    await expect(page.getByText(/1 movie saved/i)).toBeVisible();
    await expect(page.locator(`a[href="${MOVIE_PATH}"]`).first()).toBeVisible();

    // Remove it again from the detail page and confirm the watchlist empties.
    await page.goto(MOVIE_PATH);
    await page.getByRole('button', { name: /remove from watchlist/i }).click();
    await expect(page.getByRole('button', { name: /add to watchlist/i })).toBeEnabled();

    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: /your watchlist is empty/i })).toBeVisible();
  });

  test('survives repeated watchlist toggling and a rapid double-click', async ({ page }) => {
    // Seven toggles and six reloads — well beyond the default 30s budget.
    test.slow();
    await signInAnonymously(page, MOVIE_PATH);

    const addButton = page.getByRole('button', { name: /add to watchlist/i });
    const removeButton = page.getByRole('button', { name: /remove from watchlist/i });
    await expect(addButton).toBeVisible();

    // Three full add/remove cycles: the optimistic label must flip on click and
    // the committed state must survive a full reload (server-rendered prop).
    for (let cycle = 0; cycle < 3; cycle++) {
      await addButton.click();
      await expect(removeButton).toBeEnabled();
      await page.reload();
      await expect(removeButton).toBeVisible();

      await removeButton.click();
      await expect(addButton).toBeEnabled();
      await page.reload();
      await expect(addButton).toBeVisible();
    }

    // A second click while the action is pending must not double-toggle: the
    // button disables during the transition, so the result is a single add.
    // Slow server actions down so the pending window deterministically outlasts
    // the second click — on a fast server the add can commit before the click
    // dispatches, turning it into a legitimate remove and flaking the test.
    await page.route('**', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise((resolve) => setTimeout(resolve, 1_500));
      }
      await route.continue();
    });
    await addButton.click();
    await removeButton.click({ timeout: 1_000, force: true }).catch(() => {
      // Expected: the button is disabled while the server action is pending.
    });
    await expect(removeButton).toBeEnabled({ timeout: 15_000 });
    await page.reload();
    await expect(removeButton).toBeVisible();
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
    // The success toast fires after the server action commits.
    await expect(page.getByText(`Added to "${listName}"`)).toBeVisible();

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
    // The success toast fires after the server action commits.
    await expect(page.getByText(`Removed from "${listName}"`)).toBeVisible();

    await page.goto('/lists');
    await expect(page.getByRole('link', { name: new RegExp(listName, 'i') })).toContainText(
      '0 items',
    );
  });

  test('marks a movie as watched independently of the watchlist', async ({ page }) => {
    await signInAnonymously(page, MOVIE_PATH);

    // Save it for later first, to prove the two lists stay independent.
    await page.getByRole('button', { name: /add to watchlist/i }).click();
    await expect(page.getByRole('button', { name: /remove from watchlist/i })).toBeEnabled();

    // Mark it watched: the button flips, the watchlist entry stays.
    await page.getByRole('button', { name: /^mark as watched$/i }).click();
    await expect(page.getByRole('button', { name: /mark as not watched/i })).toBeEnabled();
    await expect(page.getByRole('button', { name: /remove from watchlist/i })).toBeVisible();

    // The movie shows up on the watched page.
    await page.goto('/watched');
    await expect(page.getByRole('heading', { name: /^watched$/i })).toBeVisible();
    await expect(page.getByText(/1 movie watched/i)).toBeVisible();
    await expect(page.locator(`a[href="${MOVIE_PATH}"]`).first()).toBeVisible();

    // And it is still on the watchlist.
    await page.goto('/watchlist');
    await expect(page.getByText(/1 movie saved/i)).toBeVisible();
    await expect(page.locator(`a[href="${MOVIE_PATH}"]`).first()).toBeVisible();

    // Un-mark it from the detail page and confirm the watched page empties.
    await page.goto(MOVIE_PATH);
    await page.getByRole('button', { name: /mark as not watched/i }).click();
    await expect(page.getByRole('button', { name: /^mark as watched$/i })).toBeEnabled();

    await page.goto('/watched');
    await expect(
      page.getByRole('heading', { name: /you haven't watched anything yet/i }),
    ).toBeVisible();
  });

  test('keeps the watchlist system list out of the lists UI', async ({ page }) => {
    await signInAnonymously(page, MOVIE_PATH);

    // Adding to the watchlist lazily creates the backing system list.
    await page.getByRole('button', { name: /add to watchlist/i }).click();
    await expect(page.getByRole('button', { name: /remove from watchlist/i })).toBeEnabled();

    // The lists page must not surface it: still the empty state, no card.
    await page.goto('/lists');
    await expect(
      page.getByRole('heading', { name: /you haven't created any lists yet/i }),
    ).toBeVisible();
    // Scope to the page content: the sidebar nav always has a Watchlist link.
    await expect(page.getByRole('main').getByRole('link', { name: /watchlist/i })).toHaveCount(0);

    // Neither must the add-to-list dropdown on a detail page.
    await page.goto(MOVIE_PATH);
    await page.getByRole('button', { name: 'Add to list', exact: true }).click();
    await expect(page.getByText('No lists yet')).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /watchlist/i })).toHaveCount(0);
  });

  test('toggles the watchlist from a card list dropdown', async ({ page }) => {
    await signInAnonymously(page, MOVIE_PATH);

    // Seed one watchlist item so the watchlist page renders exactly one card.
    await page.goto(MOVIE_PATH);
    await page.getByRole('button', { name: /add to watchlist/i }).click();
    // The label flips optimistically, but the button stays disabled until the
    // server action commits — wait for enabled so /watchlist sees the row.
    await expect(page.getByRole('button', { name: /remove from watchlist/i })).toBeEnabled();

    await page.goto('/watchlist');
    const card = page.locator(`a[href="${MOVIE_PATH}"]`).first();
    await expect(card).toBeVisible();

    // Open the card's quick-add dropdown and use its watchlist toggle to remove it.
    await page.getByRole('button', { name: /^quick add$/i }).click();
    await page.getByRole('menuitem', { name: /remove from watchlist/i }).click();
    // The success toast fires after the server action commits.
    await expect(page.getByText('Removed from watchlist')).toBeVisible();

    // Reload for a deterministic server render and confirm the card is gone.
    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: /your watchlist is empty/i })).toBeVisible();
    await expect(page.locator(`a[href="${MOVIE_PATH}"]`)).toHaveCount(0);
  });
});
