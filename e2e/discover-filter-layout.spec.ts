import { expect, test } from '@playwright/test';

import { openDiscoverFilters } from './helpers';

for (const width of [1220, 390]) {
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
  test.describe(`Desktop Discover filters at ${width}px`, () => {
    test.use({ viewport: { width, height: 1080 } });

    test('puts sort and secondary filters last, keeping genres and tags visible', async ({ page }) => {
      await page.goto('/discover?genreId=35&keywordId=818&runtime=90&sort_by=vote_average.desc');
      await expect(page.getByRole('button', { name: /^Filters/ })).toBeHidden();
      const nav = page.getByRole('navigation', { name: 'Discover filters', exact: true });
      const sort = nav.getByLabel('Sort By');
      await expect(sort).toBeVisible();
      await expect(nav.getByLabel('Runtime')).toHaveCount(0);
      await expect(nav.getByRole('button', { name: 'Origin Country', exact: true })).toHaveCount(0);
      await expect(nav.getByRole('button', { name: 'Watch Providers', exact: true })).toHaveCount(0);
      const tags = nav.getByRole('button', { name: 'Tags (1)', exact: true });
      const genre = nav.getByRole('button', { name: 'Comedy', exact: true });
      await expect(genre).toHaveAttribute('aria-pressed', 'true');
      expect((await tags.boundingBox())!.y).toBeGreaterThan((await genre.boundingBox())!.y);
      expect((await sort.boundingBox())!.y).toBeGreaterThan((await tags.boundingBox())!.y);
      const more = nav.getByRole('button', { name: 'More filters (1)', exact: true });
      await expect(more.locator('[data-slot="filter-count"]')).toHaveText('1');
      const secondaryPanel = await openDiscoverFilters(page);
      await expect(secondaryPanel.getByLabel('Runtime')).toContainText('Up to 90 min');
      await expect(secondaryPanel.getByRole('button', { name: 'Origin Country', exact: true })).toBeVisible();
      await expect(secondaryPanel.getByRole('button', { name: 'Watch Providers', exact: true })).toBeVisible();
      await expect(secondaryPanel.getByLabel('Sort By')).toHaveCount(0);
      await secondaryPanel.getByLabel('Runtime').click();
      await page.getByRole('option', { name: 'Any', exact: true }).click();
      await expect(more).toHaveCount(0);
      await expect(nav.getByRole('button', { name: 'More filters', exact: true }).locator('[data-slot="filter-count"]')).toHaveCount(0);
      await secondaryPanel.getByLabel('Runtime').click();
      await page.getByRole('option', { name: 'Up to 90 min', exact: true }).click();
      await expect(more).toBeVisible();
      await secondaryPanel.getByRole('button', { name: 'Show results', exact: true }).click();
      await expect(more).toBeFocused();
      const selectedTag = nav.getByRole('button', { name: 'Remove keyword based on novel or book', exact: true });
      await expect(selectedTag).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Search tags' })).toHaveCount(0);
      await tags.click();
      const popup = page.locator('[data-slot="popover-content"]').filter({ has: page.getByRole('heading', { name: 'Themes & Keywords', exact: true }) });
      await expect(popup.getByRole('combobox', { name: 'Search tags' })).toBeFocused();
      await expect(popup.getByLabel('Sort By')).toHaveCount(0);
      await expect(popup.getByRole('button', { name: 'Comedy', exact: true })).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(tags).toBeFocused();
      await selectedTag.click();
      await expect(page).not.toHaveURL(/keywordId=/);
      await expect(page).toHaveURL(/genreId=35/);
      await expect(page).toHaveURL(/runtime=90/);
      await nav.getByRole('button', { name: 'Clear all', exact: true }).click();
      await expect(page).not.toHaveURL(/genreId=|runtime=/);
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
