import { expect, test, type Page } from '@playwright/test';

import { corsHeaders, detailFixture, mockEmptySupport, preflight } from './catalog-fixtures';

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) return;
    await route.fulfill({ json: { json: [] }, headers: corsHeaders });
  });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) return;
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
  if (!bounds || !viewport) throw new Error('Navigation and viewport must have measurable bounds');
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

  await expect(page.getByRole('link', { name: 'Settings (opens browser)' })).not.toBeAttached();
  await expectDockAtBottom(page);
  await dock.getByRole('button', { name: 'More navigation' }).click();
  await expect(page).toHaveURL(/localhost:8083\/more$/);
  for (const name of ['Watchlist', 'Watched', 'Lists', 'Settings', 'Sign in']) {
    await expect(
      page.getByRole('link', { name: name + ' (opens browser)', exact: true }),
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

test('More exposes the selected browser workflow', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'More navigation', exact: true }).click();
  const popup = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Settings (opens browser)', exact: true }).click();
  await expect(await popup).toHaveURL('http://localhost:3000/settings');
  await expect(page).toHaveURL(/localhost:8083\/more$/);
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

for (const destination of ['Discover', 'Search'] as const) {
  test(destination + ' native tab shell labels its deferred browser handoff', async ({ page }) => {
    await page.goto('/' + destination.toLowerCase());
    await expect(page.getByRole('heading', { name: destination, exact: true })).toBeVisible();
    await expect(
      page.getByText('This workflow currently opens in your browser. Its native page is planned.'),
    ).toBeVisible();
    const popup = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'Open ' + destination + ' in browser' }).click();
    await expect(await popup).toHaveURL('http://localhost:3000/' + destination.toLowerCase());
  });
}

test('More tab shell exposes every secondary workflow', async ({ page }) => {
  await page.goto('/more');
  await expect(page.getByRole('heading', { name: 'More', exact: true })).toBeVisible();
  for (const name of ['Watchlist', 'Watched', 'Lists', 'Settings', 'Sign in']) {
    await expect(
      page.getByRole('link', { name: name + ' (opens browser)', exact: true }),
    ).toBeVisible();
  }
});
