import { expect, test } from '@playwright/test';

import { openDiscoverFilters } from './helpers';

for (const width of [1440, 390]) {
  test.describe(`Unified Discover filters at ${width}px`, () => {
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
