import { expect, test } from '@playwright/test';

import { closeDiscoverFilters, openDiscoverFilters, openDiscoverGenres } from './helpers';

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
  test.describe(`Compact desktop Discover toolbar at ${width}px`, () => {
    test.use({ viewport: { width, height: 1080 } });
    test('hides full facet lists and keeps controls on one row with removable selections below', async ({ page }) => {
      await page.goto('/discover?genreId=35&keywordId=818&runtime=90&sort_by=vote_average.desc');
      const nav = page.getByRole('navigation', { name: 'Discover filters', exact: true });
      const genres = nav.getByRole('button', { name: 'Genres (1)', exact: true });
      const tags = nav.getByRole('button', { name: 'Tags (1)', exact: true });
      const filters = nav.getByRole('button', { name: 'Filters (1)', exact: true });
      const sort = nav.getByLabel('Sort By');
      for (const control of [genres, tags, filters, sort]) {
        await expect(control).toBeVisible();
      }
      await expect(page.getByRole('button', { name: 'Comedy', exact: true })).toHaveCount(0);
      await expect(page.getByRole('combobox', { name: 'Search tags' })).toHaveCount(0);
      await expect(page.getByLabel('Runtime')).toHaveCount(0);
      const centers = await nav.evaluate((element) => {
        const controls = [...element.querySelectorAll('button')].filter((button) => button.checkVisibility() && button.getAttribute('aria-haspopup'));
        return controls.map((button) => { const rect = button.getBoundingClientRect(); return rect.top + rect.height / 2; });
      });
      expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(1);
      const removeGenre = nav.getByRole('button', { name: 'Remove genre Comedy', exact: true });
      const removeTag = nav.getByRole('button', { name: 'Remove keyword based on novel or book', exact: true });
      await expect(removeGenre).toBeVisible();
      await expect(removeTag).toBeVisible();
      expect((await removeGenre.boundingBox())!.y).toBeGreaterThan((await genres.boundingBox())!.y);
      const genrePanel = await openDiscoverGenres(page);
      await expect(genrePanel.getByRole('button', { name: 'Comedy', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(genrePanel.getByRole('button', { name: 'Action', exact: true })).toBeVisible();
      await expect(genrePanel.getByRole('combobox')).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(genres).toBeFocused();
      await removeGenre.click();
      await expect(page).not.toHaveURL(/genreId=/);
      await expect(page).toHaveURL(/keywordId=818/);
      await expect(page).toHaveURL(/runtime=90/);
      await expect(nav.getByRole('button', { name: 'Genres', exact: true }).locator('[data-slot="filter-count"]')).toHaveCount(0);
      const filterPanel = await openDiscoverFilters(page);
      await expect(filterPanel.getByLabel('Runtime')).toContainText('Up to 90 min');
      await expect(filterPanel.getByRole('button', { name: 'Origin Country', exact: true })).toBeVisible();
      await expect(filterPanel.getByRole('button', { name: 'Watch Providers', exact: true })).toBeVisible();
      await expect(filterPanel.getByLabel('Sort By')).toHaveCount(0);
      await closeDiscoverFilters(page);
      await tags.click();
      await expect(page.getByRole('combobox', { name: 'Search tags' })).toBeFocused();
      await closeDiscoverFilters(page);
      await removeTag.click();
      await expect(page).not.toHaveURL(/keywordId=/);
      await expect(page).toHaveURL(/runtime=90/);
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

test('closes open popovers when resizing hides their triggers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/discover');
  const panel = await openDiscoverFilters(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(panel).not.toBeVisible();
  const genresPanel = await openDiscoverGenres(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(genresPanel).not.toBeVisible();
  await page.setViewportSize({ width: 1920, height: 1080 });
  const secondaryPanel = await openDiscoverFilters(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(secondaryPanel).not.toBeVisible();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.getByRole('button', { name: 'Tags', exact: true }).click();
  const input = page.getByRole('combobox', { name: 'Search tags' });
  await input.fill('time travel');
  const option = page.getByRole('option', { name: 'time travel', exact: true });
  await expect(option).toBeVisible({ timeout: 15_000 });
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(input).not.toBeVisible();
  await expect(option).not.toBeVisible();
  await openDiscoverFilters(page);
  await expect(page.getByRole('combobox', { name: 'Search tags' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
