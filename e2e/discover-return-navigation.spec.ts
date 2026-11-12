import { expect, test } from '@playwright/test';

// A cached query alone cannot render the page while its server component is
// pending. Returning via a Link (rather than browser back) must reuse the page.
test('returning to Discover reuses the rendered page without another server request', async ({ page }) => {
  await page.goto('/discover');
  await expect(page.getByRole('heading', { name: /^discover$/i })).toBeVisible();
  await expect(page.locator('#content')).toBeVisible();

  await page.getByRole('link', { name: 'Movies home', exact: true }).click();
  await expect(page).toHaveURL('/');

  const discoverRequests: string[] = [];
  await page.route('**/discover*', async (route) => {
    if (route.request().headers()['rsc'] === '1') {
      discoverRequests.push(route.request().url());
      await route.abort();
      return;
    }
    await route.continue();
  });

  await page.getByRole('link', { name: 'Discover', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^discover$/i })).toBeVisible();
  await expect(page.locator('#content')).toBeVisible();
  expect(discoverRequests).toEqual([]);
});
