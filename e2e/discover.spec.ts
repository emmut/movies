import { expect, type Page, test } from '@playwright/test';

// End-to-end coverage for the discover page. These exercise the client-side
// URL-state machine (nuqs) that drives React Query refetches: genre pills,
// the media-type toggle, sort/runtime selects, watch-provider popover, and
// pagination. We assert on the deep-linkable URL and the app shell rather than
// on TMDB content (which changes daily); the grid is only checked for
// "renders cards OR a graceful empty state".

const MOVIE_ONLY_GENRE_ID = '28'; // Action — exists for movies, not TV
const SHARED_GENRE_ID = '35'; // Comedy — exists for both movies and TV

function discoverUrl(searchParams?: Record<string, string>) {
  const params = new URLSearchParams(searchParams);
  const query = params.toString();

  return query ? `/discover?${query}` : '/discover';
}

async function expectDiscoverShell(page: Page) {
  await expect(page.getByRole('heading', { name: /^discover$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^movies$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^tv shows$/i })).toBeVisible();
  await expect(page.getByText(/^sort by$/i)).toBeVisible();
  await expect(page.getByText(/^runtime$/i)).toBeVisible();
  // The trigger's accessible name comes from its associated label ("Watch
  // Providers"); "Select watch providers" is only its visible value text.
  await expect(page.getByRole('button', { name: /^watch providers$/i })).toBeVisible();
  await expect(page.locator('#content')).toBeVisible();
}

async function selectOption(page: Page, label: string, option: string) {
  await page.getByLabel(label).click();
  await page.getByRole('option', { name: option }).click();
}

async function waitForDiscoverUrl(page: Page, matcher: RegExp) {
  await expect(page).toHaveURL(matcher, { timeout: 15_000 });
}

// Waits for the results region to settle into either a populated grid or a
// graceful empty state, without asserting on specific (volatile) TMDB titles.
async function expectResultsSettled(page: Page, mediaType: 'movie' | 'tv') {
  const container = page.locator('#content');
  const cards = container.locator(`a[href^="/${mediaType}/"]`);
  const emptyState = container.getByText(/no .*(found|was found)/i);

  await expect(cards.first().or(emptyState)).toBeVisible({ timeout: 15_000 });
}

test.describe('discover page shell', () => {
  test('renders the controls and result region', async ({ page }) => {
    const response = await page.goto('/discover');

    expect(response?.ok()).toBeTruthy();
    await expectDiscoverShell(page);
    await expect(page.getByRole('button', { name: /action/i })).toBeVisible();
    await expectResultsSettled(page, 'movie');
  });

  test('loads without throwing a page error', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/discover');
    await expectDiscoverShell(page);
    await expectResultsSettled(page, 'movie');

    expect(pageErrors, `unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });

  test('skip-to-content link targets the results region', async ({ page }) => {
    await page.goto('/discover');
    await expectDiscoverShell(page);

    // The skip link is visually clipped (sr-only) until focused, so a plain
    // click is intercepted by the header. Activate it via the keyboard the way
    // a real keyboard user would.
    const skipLink = page.getByRole('link', { name: /skip to content/i });
    await skipLink.focus();
    await skipLink.press('Enter');
    await waitForDiscoverUrl(page, /#content$/);
  });
});

test.describe('deep links', () => {
  test('opens directly to tv mode from a deep link', async ({ page }) => {
    await page.goto(discoverUrl({ mediaType: 'tv', page: '2', runtime: '90' }));

    await expectDiscoverShell(page);
    await expect(page.getByRole('button', { name: /^tv shows$/i })).toHaveClass(/bg-white/);
    await expect(page.getByLabel('Runtime')).toContainText(/up to 90 min/i);
    await waitForDiscoverUrl(page, /mediaType=tv/);
    await waitForDiscoverUrl(page, /page=2/);
    await expectResultsSettled(page, 'tv');
  });

  test('hydrates sort and genre state from a deep link', async ({ page }) => {
    await page.goto(discoverUrl({ genreId: SHARED_GENRE_ID, sort_by: 'vote_average.desc' }));

    await expectDiscoverShell(page);
    await expect(page.getByLabel('Sort By')).toContainText(/rating \(high to low\)/i);
    await expect(
      page.getByRole('button', { name: /^comedy$/i }).locator('[data-active="true"]'),
    ).toBeVisible();
    await expectResultsSettled(page, 'movie');
  });
});

test.describe('media-type toggle', () => {
  test('switches between movies and tv without an RSC navigation', async ({ page }) => {
    await page.goto('/discover');
    await expectDiscoverShell(page);

    // The toggle updates URL state shallowly and lets React Query refetch — it
    // must NOT trigger a server RSC navigation to the new (tv) discover route.
    // We look only for a non-prefetch RSC request carrying mediaType=tv; that
    // is the "duplicate refetch" this route guards against. Ambient prefetch
    // traffic (nav/pagination links) is excluded via the prefetch header.
    const rscNavigations: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      const headers = request.headers();
      const isRsc = url.includes('_rsc=') || (headers.accept ?? '').includes('text/x-component');
      const isPrefetch = 'next-router-prefetch' in headers;
      if (url.includes('/discover') && url.includes('mediaType=tv') && isRsc && !isPrefetch) {
        rscNavigations.push(url);
      }
    });

    await page.getByRole('button', { name: /^tv shows$/i }).click();
    await waitForDiscoverUrl(page, /mediaType=tv/);
    await expect(page.getByRole('button', { name: /^tv shows$/i })).toHaveClass(/bg-white/);

    expect(rscNavigations).toEqual([]);
  });

  test('clears a movie-only genre when switching to tv', async ({ page }) => {
    await page.goto(discoverUrl({ genreId: MOVIE_ONLY_GENRE_ID }));
    await expectDiscoverShell(page);
    await waitForDiscoverUrl(page, new RegExp(`genreId=${MOVIE_ONLY_GENRE_ID}`));

    await page.getByRole('button', { name: /^tv shows$/i }).click();

    await waitForDiscoverUrl(page, /mediaType=tv/);
    await expect(page).not.toHaveURL(new RegExp(`genreId=${MOVIE_ONLY_GENRE_ID}`));
  });

  test('keeps a shared genre when switching media type', async ({ page }) => {
    await page.goto(discoverUrl({ genreId: SHARED_GENRE_ID }));
    await expectDiscoverShell(page);
    await waitForDiscoverUrl(page, new RegExp(`genreId=${SHARED_GENRE_ID}`));

    await page.getByRole('button', { name: /^tv shows$/i }).click();

    await waitForDiscoverUrl(page, /mediaType=tv/);
    await waitForDiscoverUrl(page, new RegExp(`genreId=${SHARED_GENRE_ID}`));
  });

  test('resets pagination to page 1 when switching media type', async ({ page }) => {
    await page.goto(discoverUrl({ page: '3' }));
    await expectDiscoverShell(page);

    await page.getByRole('button', { name: /^tv shows$/i }).click();

    await waitForDiscoverUrl(page, /mediaType=tv/);
    await expect(page).not.toHaveURL(/page=3/);
  });

  test('shows tv-specific sort options in tv mode', async ({ page }) => {
    await page.goto(discoverUrl({ mediaType: 'tv' }));
    await expectDiscoverShell(page);

    await selectOption(page, 'Sort By', 'First Air Date (Newest)');
    await waitForDiscoverUrl(page, /sort_by=first_air_date\.desc/);
  });
});

test.describe('genre navigation', () => {
  test('selecting a genre pill updates the URL and resets to page 1', async ({ page }) => {
    await page.goto(discoverUrl({ page: '2' }));
    await expectDiscoverShell(page);

    await page.getByRole('button', { name: /^comedy$/i }).click();

    await waitForDiscoverUrl(page, new RegExp(`genreId=${SHARED_GENRE_ID}`));
    await expect(page).not.toHaveURL(/page=2/);
  });

  test('clicking the active genre again clears the filter', async ({ page }) => {
    await page.goto(discoverUrl({ genreId: SHARED_GENRE_ID }));
    await expectDiscoverShell(page);
    await waitForDiscoverUrl(page, new RegExp(`genreId=${SHARED_GENRE_ID}`));

    await page.getByRole('button', { name: /^comedy$/i }).click();

    await expect(page).not.toHaveURL(new RegExp(`genreId=${SHARED_GENRE_ID}`));
  });
});

test.describe('filters', () => {
  test('updates sort, runtime, and pagination query state', async ({ page }) => {
    await page.goto('/discover');
    await expectDiscoverShell(page);

    await selectOption(page, 'Sort By', 'Rating (High to Low)');
    await waitForDiscoverUrl(page, /sort_by=vote_average\.desc/);

    await selectOption(page, 'Runtime', 'Up to 90 min');
    await waitForDiscoverUrl(page, /runtime=90/);

    await page.getByRole('button', { name: '2', exact: true }).click();
    await waitForDiscoverUrl(page, /page=2/);

    // Paginating scrolls imperatively; the URL never carries a fragment.
    await expect
      .poll(() => page.evaluate(() => window.location.hash), { timeout: 5_000 })
      .toBe('');
  });

  test('resets pagination to page 1 when a filter changes', async ({ page }) => {
    await page.goto(discoverUrl({ page: '3' }));
    await expectDiscoverShell(page);

    await selectOption(page, 'Sort By', 'Rating (High to Low)');

    await waitForDiscoverUrl(page, /sort_by=vote_average\.desc/);
    await expect(page).not.toHaveURL(/page=3/);
  });

  test('clearing the runtime filter removes it from the URL', async ({ page }) => {
    await page.goto(discoverUrl({ runtime: '90' }));
    await expectDiscoverShell(page);
    await expect(page.getByLabel('Runtime')).toContainText(/up to 90 min/i);

    await selectOption(page, 'Runtime', 'Any');

    await expect(page).not.toHaveURL(/runtime=/);
  });

  test('selects and clears watch provider filters', async ({ page }) => {
    await page.goto('/discover');
    await expectDiscoverShell(page);

    const trigger = page.getByRole('button', { name: /^watch providers$/i });
    await trigger.click();

    const providers = page.locator('[data-slot="popover-content"] button').filter({
      hasNotText: /clear all/i,
    });

    await expect(providers.first()).toBeVisible();
    await providers.first().click();
    // Selecting a provider writes the filter and keeps the popover open, so
    // "Clear all" becomes available without reopening. (watch_region is only
    // added to the URL when it differs from the user's default region.)
    await waitForDiscoverUrl(page, /with_watch_providers=/);
    // The trigger's visible value reflects the selection count.
    await expect(trigger).toContainText(/1 provider selected/i);

    await page.getByRole('button', { name: /clear all/i }).click();

    await expect(page).not.toHaveURL(/with_watch_providers=/);
  });
});
