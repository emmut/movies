import { expect, test } from '@playwright/test';

import { openDiscoverFilters } from './helpers';

test.setTimeout(60_000);

for (const width of [1280, 390]) {
  test.describe(`Discover tag search at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('adds tags without a PDP and preserves filters, pagination and history', async ({ page }) => {
      await page.goto('/discover?mediaType=tv&genreId=35&sort_by=vote_count.desc&page=2');
      await openDiscoverFilters(page);
      const input = page.getByRole('combobox', { name: 'Search tags' });
      await expect(input).toBeVisible();
      await input.fill('time travel');
      const timeTravel = page.getByRole('option', { name: 'time travel', exact: true });
      await expect(timeTravel).toBeVisible({ timeout: 15_000 });
      await input.press('ArrowDown');
      await input.press('Enter');
      const removeTimeTravel = page.getByRole('button', { name: 'Remove keyword time travel', exact: true });
      await expect(removeTimeTravel).toBeVisible({ timeout: 15_000 });
      await expect(input).toHaveValue('');

      const params = new URL(page.url()).searchParams;
      expect(params.get('mediaType')).toBe('tv');
      expect(params.get('genreId')).toBe('35');
      expect(params.get('sort_by')).toBe('vote_count.desc');
      expect(params.get('page') ?? '1').toBe('1');
      expect(params.get('keywordId')).toMatch(/^\d+$/);

      await input.fill('monster');
      await page.getByRole('option', { name: 'monster', exact: true }).click({ timeout: 15_000 });
      await expect(page.getByRole('button', { name: 'Remove keyword monster', exact: true })).toBeVisible({ timeout: 15_000 });
      expect(new URL(page.url()).searchParams.get('keywordId')?.split(',')).toHaveLength(2);

      await input.fill('time travel');
      await expect(page.getByText('Searching tags…')).toHaveCount(0, { timeout: 15_000 });
      await expect(page.getByRole('option', { name: 'time travel', exact: true })).toHaveCount(0);
      await input.fill('zxqvnonexistenttagzxqv');
      await expect(page.getByText('No matching tags found.')).toBeVisible({ timeout: 15_000 });
      await input.press('Escape');

      await removeTimeTravel.click();
      await expect(removeTimeTravel).toHaveCount(0);
      expect(new URL(page.url()).searchParams.get('keywordId')?.split(',')).toHaveLength(1);
      await page.goBack();
      await expect(removeTimeTravel).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    });
  });
}

test('shows a failed tag search and retries successfully', async ({ page }) => {
  await page.goto('/discover');
  await openDiscoverFilters(page);
  const input = page.getByRole('combobox', { name: 'Search tags' });
  await expect(input).toBeVisible();
  let failSearch = true;
  await page.route('**/discover*', async (route) => {
    if (route.request().method() === 'POST' && failSearch) {
      failSearch = false;
      await route.abort('failed');
      return;
    }
    await route.continue();
  });
  await input.fill('time travel');
  await expect(page.getByText('Tags could not be loaded.')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('option', { name: 'time travel', exact: true })).toBeVisible({ timeout: 15_000 });
});
