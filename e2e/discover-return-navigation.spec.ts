import { expect, test } from '@playwright/test';

// A cached query alone cannot render the page while its server component is
// pending. Returning via a Link (rather than browser back) must reuse the page.
test('returning to Discover reuses the rendered page without waiting for a server response', async ({ page }) => {
  await page.goto('/discover');
  await expect(page.getByRole('heading', { name: /^discover$/i })).toBeVisible();
  await expect(page.locator('#content')).toBeVisible();

  await page.getByRole('link', { name: 'Movies home', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: /^discover$/i })).not.toBeVisible();

  await page.evaluate(() => {
    document.documentElement.dataset.discoverCacheTest = 'same-document';
  });
  await page.route('**/discover*', async (route) => {
    // Block every rendering response, including speculative prefetches and a
    // potential document reload fallback. The restored view must use memory.
    if (route.request().headers()['rsc'] === '1' || route.request().isNavigationRequest()) {
      await route.abort();
      return;
    }
    await route.continue();
  });

  await page.getByRole('link', { name: 'Discover', exact: true }).click();
  await expect(page).toHaveURL('/discover');
  await expect(page.getByRole('heading', { name: /^discover$/i })).toBeVisible();
  await expect(page.locator('#content')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-discover-cache-test', 'same-document');
});
