import { expect, test } from '@playwright/test';

import { closeDiscoverFilters, openDiscoverFilters } from './helpers';

for (const width of [1220, 390, 320]) {
  test.describe(`Compact Discover filters at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test('shows a corner count badge and a spacious, scrollable dropdown', async ({ page }) => {
      await page.goto('/discover?genreId=35&keywordId=818&runtime=90');
      const trigger = page.getByRole('button', { name: /^Filters(?: \(\d+\))?$/ });
      await expect(trigger).toHaveAccessibleName('Filters (3)');
      const badge = trigger.locator('[data-slot="filter-count"]');
      await expect(badge).toHaveText('3');
      await expect(page.getByRole('combobox', { name: 'Search tags' })).toHaveCount(0);
      const buttonBounds = (await trigger.boundingBox())!;
      const badgeBounds = (await badge.boundingBox())!;
      expect(badgeBounds.width).toBe(badgeBounds.height);
      expect(badgeBounds.x + badgeBounds.width / 2).toBeGreaterThan(buttonBounds.x + buttonBounds.width - 8);
      expect(badgeBounds.y).toBeLessThan(buttonBounds.y);

      const panel = await openDiscoverFilters(page);
      const search = panel.getByRole('combobox', { name: 'Search tags' });
      await expect(search).toBeVisible();
      await expect(panel.getByRole('button', { name: 'Remove keyword based on novel or book', exact: true })).toBeVisible();
      await expect.poll(async () => {
        const panelWidth = (await panel.boundingBox())!.width;
        const contentWidth = (await page.locator('#content').boundingBox())!.width;
        return Math.abs(panelWidth - Math.min(672, contentWidth));
      }).toBeLessThan(1);
      expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

      const resultsButton = panel.getByRole('button', { name: 'Show results', exact: true });
      const footerBounds = (await resultsButton.boundingBox())!;
      expect(footerBounds.y + footerBounds.height).toBeLessThanOrEqual(844);
      await panel.getByRole('button', { name: 'Comedy', exact: true }).click();
      await expect(trigger).toHaveAccessibleName('Filters (2)');
      await expect(badge).toHaveText('2');
      await panel.getByRole('button', { name: 'Clear all', exact: true }).click();
      await expect(trigger).toHaveAccessibleName('Filters');
      await expect(badge).toHaveCount(0);
      await resultsButton.click();
      await expect(panel).not.toBeVisible();
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    });
  });
}

for (const width of [1440, 1920]) {
  test.describe(`Unified desktop Discover toolbar at ${width}px`, () => {
    test.use({ viewport: { width, height: 1080 } });

    test('groups facets under one Filters button and keeps sort and chips outside', async ({ page }) => {
      await page.goto('/discover?genreId=35&keywordId=818&runtime=90&sort_by=vote_average.desc');
      const nav = page.getByRole('navigation', { name: 'Discover filters', exact: true });
      const filters = nav.getByRole('button', { name: /^Filters(?: \(\d+\))?$/ });
      const sort = nav.getByLabel('Sort By').filter({ visible: true });
      await expect(filters).toBeVisible();
      await expect(filters).toHaveAccessibleName('Filters (4)');
      await expect(sort).toBeVisible();
      await expect(nav.getByRole('button', { name: /^(Genres|Tags|Companies|Networks)( \(\d+\))?$/ })).toHaveCount(0);
      await expect(nav.getByRole('combobox', { name: 'Search tags' })).toHaveCount(0);
      const centers = await nav.evaluate((element) => {
        return [...element.querySelectorAll('button[aria-haspopup]')]
          .filter((button) => button.checkVisibility())
          .map((button) => { const rect = button.getBoundingClientRect(); return rect.top + rect.height / 2; });
      });
      expect(centers).toHaveLength(2);
      expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(1);
      const chips = nav.getByLabel('Active filters');
      const removeGenre = chips.getByRole('button', { name: 'Remove genre Comedy', exact: true });
      const removeTag = chips.getByRole('button', { name: 'Remove keyword based on novel or book', exact: true });
      await expect(removeGenre).toBeVisible();
      await expect(removeTag).toBeVisible();
      expect((await removeGenre.boundingBox())!.y).toBeGreaterThan((await filters.boundingBox())!.y);

      const panel = await openDiscoverFilters(page);
      await expect(panel.getByRole('button', { name: 'Comedy', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(panel.getByRole('combobox', { name: 'Search tags' })).toBeVisible();
      await expect(panel.getByRole('combobox', { name: 'Search production companies' })).toBeVisible();
      await expect(panel.getByLabel('Sort By')).toBeHidden();
      await expect(panel.getByLabel('Runtime')).toContainText('Up to 90 min');
      await expect(panel.getByRole('button', { name: 'Origin Country', exact: true })).toBeVisible();
      await expect(panel.getByRole('button', { name: 'Watch Providers', exact: true })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(filters).toBeFocused();
      await removeGenre.click();
      await expect(page).not.toHaveURL(/genreId=/);
      await expect(page).toHaveURL(/keywordId=818/);
      await expect(filters).toHaveAccessibleName('Filters (3)');
      await removeTag.click();
      await expect(page).not.toHaveURL(/keywordId=/);
      await expect(filters).toHaveAccessibleName('Filters (2)');
      await nav.getByRole('button', { name: 'Clear all', exact: true }).click();
      await expect(page).not.toHaveURL(/runtime=|sort_by=/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      const duplicateIds = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
        return ids.filter((id, index) => ids.indexOf(id) !== index);
      });
      expect(duplicateIds).toEqual([]);
    });
  });
}

test('keeps one filter panel and its search when resizing between mobile and desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/discover');
  const panel = await openDiscoverFilters(page);
  const input = panel.getByRole('combobox', { name: 'Search tags' });
  await input.fill('time travel');
  const option = page.getByRole('option', { name: 'time travel', exact: true });
  await expect(option).toBeVisible({ timeout: 15_000 });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(panel).toBeVisible();
  await expect(input).toHaveValue('time travel');
  await expect(option).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(input).toHaveValue('time travel');
  await input.press('Escape');
  await closeDiscoverFilters(page);
  await expect(panel).toBeHidden();
  await expect(page.getByRole('button', { name: 'Filters', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
