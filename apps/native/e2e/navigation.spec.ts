import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
} from '@native/e2e/catalog-fixtures';
import { sessionResponse } from '@native/e2e/session-fixtures';
import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/discovery/list*', (route) =>
    route.fulfill({
      json: { json: { items: [], totalPages: 0, totalResults: 0 } },
      headers: corsHeaders,
    }),
  );
  await page.route('**/rpc/discovery/options*', (route) =>
    route.fulfill({
      json: { json: { genres: [], providers: [], countries: [] } },
      headers: corsHeaders,
    }),
  );
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: [] }, headers: corsHeaders });
  });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: detailFixture('movie') }, headers: corsHeaders });
  });
  await page
    .context()
    .route('http://localhost:3000/**', (route) => route.fulfill({ body: 'Movies web workflow' }));
});

async function expectDockAtBottom(page: Page) {
  const bounds = await page
    .getByTestId('bottom-navigation')
    .filter({ visible: true })
    .boundingBox();
  const viewport = page.viewportSize();
  if (!bounds || !viewport) {
    throw new Error('Navigation and viewport must have measurable bounds');
  }
  expect(bounds.y).toBeGreaterThan(viewport.height - 100);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
}

test('keeps only Home, Discover, Search and overflow at the bottom', async ({ page }) => {
  await page.goto('/');
  const dock = page.getByTestId('bottom-navigation');
  for (const name of ['Home', 'Discover', 'Search', 'More navigation']) {
    await expect(dock.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await expect(dock.getByRole('button')).toHaveCount(4);

  await expect(page.getByRole('link', { name: 'Lists (opens browser)' })).not.toBeAttached();
  await expectDockAtBottom(page);
  await dock.getByRole('button', { name: 'More navigation' }).click();
  await expect(page).toHaveURL(/localhost:8083\/more$/);
  for (const name of ['Watchlist', 'Watched', 'Lists', 'Settings', 'Sign in']) {
    await expect(
      page.getByRole('link', {
        name,
        exact: true,
      }),
    ).toBeVisible();
  }
  await page
    .getByTestId('bottom-navigation')
    .getByRole('button', { name: 'Home', exact: true })
    .click();
  await expect(page).toHaveURL(/localhost:8083\/$/);
  await page.screenshot({ path: '/tmp/movies-bottom-navigation.png' });
});

for (const destination of ['Discover', 'Search'] as const) {
  test(`${destination} stays directly accessible from the primary dock`, async ({ page }) => {
    await page.goto('/');

    await page
      .getByTestId('bottom-navigation')
      .getByRole('button', { name: destination, exact: true })
      .click();
    await expect(page).toHaveURL('http://localhost:8083/' + destination.toLowerCase());
    await expect(page.getByRole('heading', { name: destination, exact: true })).toBeVisible();
    expect(page.context().pages()).toHaveLength(1);
  });
}

test('More opens Lists natively and preserves the sign-in return destination', async ({ page }) => {
  await page.goto('/more');
  await page.getByRole('link', { name: 'Lists', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?redirect_url=%2Fmore%2Flists$/);
  expect(page.context().pages()).toHaveLength(1);
});

test('can close sign-in opened directly from a failed OAuth callback', async ({ page }) => {
  await page.goto('/login?error=failed_to_login');
  await expect(page.getByRole('alert')).toHaveText('Couldn’t sign in. Please try again.');
  await page.getByRole('button', { name: 'Close sign in', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:8083/more');
  await expect(page.getByRole('heading', { name: 'More', exact: true })).toBeVisible();
});

test('closing a protected-page sign-in returns to More without another login redirect', async ({
  page,
}) => {
  await page.goto('/more');
  await page.getByRole('link', { name: 'Lists', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?redirect_url=%2Fmore%2Flists$/);
  await page.getByRole('button', { name: 'Close sign in', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:8083/more');
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:8083/login');
  await expect(page.getByRole('button', { name: 'Close sign in', exact: true })).toBeVisible();
});

test('closing a pending sign-in prevents its later result from reopening the protected page', async ({
  page,
}) => {
  let signedIn = false;
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/auth/get-session*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const session = sessionResponse();
    session.user.isAnonymous = false;
    await route.fulfill({ json: signedIn ? session : null, headers: corsHeaders });
  });
  await page.route('**/api/auth/sign-in/social', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await pending;
    signedIn = true;
    await route.fulfill({ json: { redirect: false }, headers: corsHeaders });
  });
  await page.goto('/login?redirect_url=%2Fmore%2Flists');
  await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).click();
  await expect(page.getByLabel('Signing in')).toBeVisible();
  await page.getByRole('button', { name: 'Close sign in', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:8083/more');
  const verified = page.waitForResponse(
    (response) => signedIn && response.url().includes('/api/auth/get-session'),
  );
  release();
  await (await verified).finished();
  // Allow the verification response and any resulting navigation to commit.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(page.getByRole('heading', { name: 'More', exact: true })).toBeVisible();
  await expect(page).toHaveURL('http://localhost:8083/more');
});

test('detail screens retain the dock and Home returns to the native homepage', async ({ page }) => {
  await page.goto('/movie/42');
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  const dock = page.getByTestId('bottom-navigation');
  await expect(dock.getByRole('button', { name: 'More navigation' })).toBeVisible();
  await expectDockAtBottom(page);
  await dock.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page).toHaveURL(/localhost:8083\/$/);
  await expect(page.getByText('Trending Now', { exact: true })).toBeVisible();
  expect(page.context().pages()).toHaveLength(1);
});

test('Search starts natively without a browser handoff', async ({ page }) => {
  await page.goto('/search');
  await expect(page.getByRole('heading', { name: 'Search', exact: true })).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Search movies, TV shows and people' }),
  ).toBeVisible();
  await expect(page.getByText('Find movies, TV shows and people.')).toBeVisible();
  expect(page.context().pages()).toHaveLength(1);
});

test('More tab shell exposes every secondary workflow', async ({ page }) => {
  await page.goto('/more');
  await expect(page.getByRole('heading', { name: 'More', exact: true })).toBeVisible();
  for (const name of ['Watchlist', 'Watched', 'Lists', 'Settings', 'Sign in']) {
    await expect(
      page.getByRole('link', {
        name,
        exact: true,
      }),
    ).toBeVisible();
  }
});

test('opens complete source credits natively without signing in', async ({ page }) => {
  await page.goto('/more');
  await page.getByRole('link', { name: 'Credits', exact: true }).click();
  await expect(page).toHaveURL(/\/more\/credits$/);
  for (const name of ['The Movie Database', 'JustWatch', 'Wikidata', 'IMDb']) {
    await expect(
      page.getByRole('heading', { name, exact: true }).filter({ visible: true }),
    ).toBeVisible();
  }
  await expect(page.getByText(/not endorsed or certified by TMDB/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'CC0 license (opens browser)' })).toBeVisible();
});

test('IMDb title deep links resolve natively and invalid IDs never reach the API', async ({
  page,
}) => {
  let requests = 0;
  await page.route('**/rpc/catalog/resolveImdb*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    requests += 1;
    await route.fulfill({ headers: corsHeaders, json: { json: { id: 42, type: 'movie' } } });
  });
  await page.goto('/title/tt1234567');
  await expect(page).toHaveURL(/\/movie\/42$/);
  await page.goto('/title/invalid');
  await expect(page.getByRole('heading', { name: 'Title not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Search titles' }).click();
  await expect(page).toHaveURL(/\/search$/);
  expect(requests).toBe(1);
});
