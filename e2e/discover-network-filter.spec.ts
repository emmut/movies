import { expect, test, type Page } from '@playwright/test';

import { openDiscoverFilters } from './helpers';

test.setTimeout(60_000);

async function openNetworks(page: Page) {
  await expect(page.getByRole('navigation', { name: 'Discover filters', exact: true })).toBeVisible();
  const trigger = page.getByRole('button', { name: /^Networks(?: \(\d+\))?$/ });
  if (await trigger.isVisible()) {
    if (await trigger.getAttribute('aria-expanded') !== 'true') {
      await trigger.click();
    }
  } else {
    await openDiscoverFilters(page);
  }
  return page.getByRole('region', { name: 'Networks', exact: true });
}

for (const width of [1920, 390]) {
  test.describe(`Networks at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('restores networks, removes them, navigates back and clears TV-only state', async ({ page }) => {
      await page.goto('/discover?mediaType=tv&networkId=49,213&genreId=18&page=2');
      const panel = await openNetworks(page);
      const removeHbo = panel.getByRole('button', { name: 'Remove network HBO', exact: true });
      await expect(removeHbo).toBeVisible({ timeout: 15_000 });
      await expect(panel.getByRole('button', { name: 'Remove network Netflix', exact: true })).toBeVisible();
      await removeHbo.click();
      await expect(page).toHaveURL(/networkId=213/);
      expect(new URL(page.url()).searchParams.get('page') ?? '1').toBe('1');
      await page.goBack();
      await openNetworks(page);
      await expect(removeHbo).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);

      const showResults = page.getByRole('button', { name: 'Show results', exact: true });
      if (await showResults.isVisible()) {
        await showResults.click();
        await expect(showResults).toBeHidden();
        await openDiscoverFilters(page);
      } else {
        await page.getByRole('button', { name: /^Networks(?: \(\d+\))?$/ }).click();
      }
      await page.getByRole('button', { name: 'Clear all', exact: true }).click();
      await expect(page).not.toHaveURL(/networkId=/);
      await page.goto('/discover?mediaType=tv&networkId=49');
      await page.getByRole('button', { name: 'Movies', exact: true }).click();
      await expect(page).not.toHaveURL(/networkId=/);
      await expect(page.getByRole('button', { name: /^Networks(?: \(\d+\))?$/ })).not.toBeVisible();
    });
  });
}

test('TV network links open the matching Discover view', async ({ page }) => {
  await page.goto('/tv/1399');
  const hbo = page.getByRole('link', { name: 'HBO', exact: true }).and(page.locator('a[href*="networkId="]'));
  await expect(hbo).toHaveAttribute('href', '/discover?networkId=49&mediaType=tv');
  await hbo.click();
  await expect(page).toHaveURL(/networkId=49/);
  expect(new URL(page.url()).searchParams.get('mediaType')).toBe('tv');
  const panel = await openNetworks(page);
  await expect(panel.getByRole('button', { name: 'Remove network HBO', exact: true })).toBeVisible({ timeout: 15_000 });
});
