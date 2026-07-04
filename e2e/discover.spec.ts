import { expect, type Page, test } from '@playwright/test';

const MOVIE_ONLY_GENRE_ID = '28';
const SHARED_GENRE_ID = '35';

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
  await expect(page.getByRole('button', { name: /select watch providers/i })).toBeVisible();
  await expect(page.locator('#content-container')).toBeVisible();
}

async function selectOption(page: Page, label: string, option: string) {
  await page.getByLabel(label).click();
  await page.getByRole('option', { name: option }).click();
}

async function waitForDiscoverUrl(page: Page, matcher: RegExp) {
  await expect(page).toHaveURL(matcher, { timeout: 15_000 });
}

test('renders the discover page controls and result region', async ({ page }) => {
  const response = await page.goto('/discover');

  expect(response?.ok()).toBeTruthy();
  await expectDiscoverShell(page);
  await expect(page.getByRole('button', { name: /action/i })).toBeVisible();
});

test('opens directly to tv mode from a deep link', async ({ page }) => {
  await page.goto(discoverUrl({ mediaType: 'tv', page: '2', runtime: '90' }));

  await expectDiscoverShell(page);
  await expect(page.getByRole('button', { name: /^tv shows$/i })).toHaveClass(/bg-white/);
  await expect(page.getByLabel('Runtime')).toContainText(/up to 90 min/i);
  await waitForDiscoverUrl(page, /mediaType=tv/);
  await waitForDiscoverUrl(page, /page=2/);
});

test('switches between movies and tv without an RSC refresh request', async ({ page }) => {
  await page.goto('/discover');
  await expectDiscoverShell(page);

  const rscRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    const acceptHeader = request.headers().accept ?? '';
    if (url.includes('/discover') && (url.includes('_rsc=') || acceptHeader.includes('text/x-component'))) {
      rscRequests.push(url);
    }
  });

  await page.getByRole('button', { name: /^tv shows$/i }).click();
  await waitForDiscoverUrl(page, /mediaType=tv/);
  await expect(page.getByRole('button', { name: /^tv shows$/i })).toHaveClass(/bg-white/);

  expect(rscRequests).toEqual([]);
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

test('updates sort, runtime, and pagination query state', async ({ page }) => {
  await page.goto('/discover');
  await expectDiscoverShell(page);

  await selectOption(page, 'Sort By', 'Rating (High to Low)');
  await waitForDiscoverUrl(page, /sort_by=vote_average\.desc/);

  await selectOption(page, 'Runtime', 'Up to 90 min');
  await waitForDiscoverUrl(page, /runtime=90/);

  await page.getByRole('link', { name: /^2$/ }).click();
  await waitForDiscoverUrl(page, /page=2/);
});

test('selects and clears watch provider filters', async ({ page }) => {
  await page.goto('/discover');
  await expectDiscoverShell(page);

  await page.getByRole('button', { name: /select watch providers/i }).click();
  const providers = page.locator('[data-slot="popover-content"] button').filter({
    hasNotText: /clear all/i,
  });

  await expect(providers.first()).toBeVisible();
  await providers.first().click();
  await waitForDiscoverUrl(page, /with_watch_providers=/);
  await waitForDiscoverUrl(page, /watch_region=/);
  await expect(page.getByRole('button', { name: /1 provider selected/i })).toBeVisible();

  await page.getByRole('button', { name: /1 provider selected/i }).click();
  await page.getByRole('button', { name: /clear all/i }).click();

  await expect(page).not.toHaveURL(/with_watch_providers=/);
  await expect(page).not.toHaveURL(/watch_region=/);
});
