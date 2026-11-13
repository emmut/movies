import { expect, test } from '@playwright/test';

// A cached query alone cannot render the page while its server component is
// pending. Returning via a Link (rather than browser back) must reuse the page.
test('returning to Discover reuses the rendered page without another server request', async ({ page }) => {
  await page.goto('/discover');
  await expect(page.getByRole('heading', { name: /^discover$/i })).toBeVisible();
  await expect(page.locator('#content')).toBeVisible();

  await page.getByRole('link', { name: 'Movies home', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: /^discover$/i })).not.toBeVisible();

  const navigationRequests: string[] = [];
  await page.route('**/discover*', async (route) => {
    const headers = route.request().headers();
    if (headers['rsc'] === '1') {
      // Link visibility/hover can prefetch even when navigation uses the cache.
      // Block those too: the restored page must not depend on their responses.
      if (!headers['next-router-prefetch'] && !headers['next-router-segment-prefetch']) {
        navigationRequests.push(route.request().url());
      }
      await route.abort();
      return;
    }
    await route.continue();
  });

  await page.getByRole('link', { name: 'Discover', exact: true }).click();
  await expect(page).toHaveURL('/discover');
  await expect(page.getByRole('heading', { name: /^discover$/i })).toBeVisible();
  await expect(page.locator('#content')).toBeVisible();
  expect(navigationRequests).toEqual([]);
});
