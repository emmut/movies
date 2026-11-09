import { expect, test, type Page } from '@playwright/test';

import { openDiscoverFilters } from './helpers';

test.setTimeout(90_000);

async function openCompanies(page: Page) {
  const trigger = page.getByRole('button', { name: /^Companies(?: \(\d+\))?$/ });
  if (await trigger.isVisible()) {
    if (await trigger.getAttribute('aria-expanded') !== 'true') {
      await trigger.click();
    }
  } else {
    await openDiscoverFilters(page);
  }
  await expect(page.getByRole('combobox', { name: 'Search production companies' })).toBeVisible();
}

for (const width of [1920, 390]) {
  test.describe(`Production companies at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('searches, combines, restores and clears production companies', async ({ page }) => {
      await page.goto('/discover?genreId=18&page=2');
      await openCompanies(page);
      const input = page.getByRole('combobox', { name: 'Search production companies' });
      await input.fill('A24');
      await page.getByRole('option', { name: 'A24', exact: true }).first().click({ timeout: 20_000 });
      const removeA24 = page.getByRole('region', { name: 'Production companies', exact: true }).getByRole('button', { name: 'Remove company A24', exact: true });
      await expect(removeA24).toBeVisible({ timeout: 20_000 });
      await expect(page).toHaveURL(/companyId=\d+/);
      expect(new URL(page.url()).searchParams.get('page') ?? '1').toBe('1');
      expect(new URL(page.url()).searchParams.get('genreId')).toBe('18');

      await input.fill('Pixar');
      await page.getByRole('option', { name: 'Pixar', exact: true }).first().click({ timeout: 20_000 });
      await expect(page.getByRole('region', { name: 'Production companies', exact: true }).getByRole('button', { name: 'Remove company Pixar', exact: true })).toBeVisible({ timeout: 20_000 });
      expect(new URL(page.url()).searchParams.get('companyId')?.split(',')).toHaveLength(2);
      await page.reload();
      await openCompanies(page);
      await expect(removeA24).toBeVisible({ timeout: 20_000 });
      await removeA24.click();
      await expect(removeA24).toHaveCount(0);
      await page.goBack();
      await openCompanies(page);
      await expect(removeA24).toBeVisible({ timeout: 20_000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      const showResults = page.getByRole('button', { name: 'Show results', exact: true });
      if (await showResults.isVisible()) {
        await showResults.click();
        await expect(showResults).toBeHidden();
        await openDiscoverFilters(page);
      } else {
        await page.getByRole('button', { name: /^Companies(?: \(\d+\))?$/ }).click();
      }
      const clear = page.getByRole('button', { name: 'Clear all', exact: true });
      await clear.click();
      await expect(page).not.toHaveURL(/companyId=/);
      await expect(removeA24).toHaveCount(0);
    });
  });
}
