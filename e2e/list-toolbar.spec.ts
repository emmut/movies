import { expect, test } from '@playwright/test';

import { MOVIE_PATH, signInAnonymously } from './helpers';

test.setTimeout(90_000);

for (const width of [1440, 390, 320]) {
  test.describe(`List toolbar at ${width}px`, () => {
    test.use({ viewport: { width, height: 1000 } });

    test('shows provider selections as removable chips and restores reordering when cleared', async ({ page }, testInfo) => {
      await signInAnonymously(page, MOVIE_PATH);
      await page.getByRole('button', { name: /add to watchlist/i }).click();
      await expect(page.getByRole('button', { name: /remove from watchlist/i })).toBeEnabled({ timeout: 15_000 });
      await page.getByRole('button', { name: /^mark as watched$/i }).click();
      await expect(page.getByRole('button', { name: /mark as not watched/i })).toBeEnabled({ timeout: 15_000 });

      for (const path of ['/watchlist', '/watched']) {
        await page.goto(`${path}?mediaType=movie&page=2`);
        const toolbar = page.locator('[data-slot="list-toolbar"]');
        const header = page.locator('[data-slot="list-header-row"]');
        const reorder = header.getByRole('button', { name: 'Reorder items', exact: true });
        const movies = toolbar.getByRole('button', { name: 'Movies', exact: true });
        const trigger = toolbar.getByRole('button', { name: 'Providers', exact: true });
        await expect(movies).toBeVisible();
        await expect(trigger).toBeVisible();
        await expect(reorder).toBeEnabled();
        await expect(toolbar.getByRole('button', { name: 'Reorder items', exact: true })).toHaveCount(0);
        const [reorderBounds, triggerBounds] = await Promise.all([reorder.boundingBox(), trigger.boundingBox()]);
        expect(reorderBounds!.y + reorderBounds!.height).toBeLessThan(triggerBounds!.y);
        if (width < 640) {
          expect(reorderBounds!.width).toBe(44);
          expect(reorderBounds!.height).toBe(44);
        }
        if (width === 1440) {
          const [movieBounds, filterBounds] = await Promise.all([movies.boundingBox(), trigger.boundingBox()]);
          expect(filterBounds!.x).toBeGreaterThan(movieBounds!.x);
          expect(Math.abs((movieBounds!.y + movieBounds!.height / 2) - (filterBounds!.y + filterBounds!.height / 2))).toBeLessThan(1);
        }
        await trigger.click();
        const popup = page.locator('[data-slot="popover-content"]').filter({ has: page.getByRole('heading', { name: 'Watch Providers', exact: true }) });
        const provider = popup.getByRole('button').filter({ hasNotText: /clear all/i }).first();
        await expect(provider).toBeVisible();
        const name = (await provider.getAttribute('aria-label'))!;
        await provider.click();
        await expect(provider).toHaveAttribute('aria-pressed', 'true');
        await expect(page).toHaveURL(/with_watch_providers=/);
        expect(new URL(page.url()).searchParams.get('page') ?? '1').toBe('1');
        expect(new URL(page.url()).searchParams.get('mediaType')).toBe('movie');
        const filteredTrigger = toolbar.getByRole('button', { name: 'Providers (1)', exact: true });
        await expect(filteredTrigger.locator('[data-slot="filter-count"]')).toHaveText('1');
        await expect(reorder).toHaveCount(0);
        await page.keyboard.press('Escape');
        await expect(popup).not.toBeVisible();
        await expect(filteredTrigger).toBeFocused();
        const selection = toolbar.getByRole('group', { name: 'Selected providers', exact: true });
        await selection.getByRole('button', { name: `Remove provider ${name}`, exact: true }).click();
        await expect(page).not.toHaveURL(/with_watch_providers=|watch_region=/);
        await expect(selection).toHaveCount(0);
        await expect(trigger).toBeVisible();
        await expect(trigger.locator('[data-slot="filter-count"]')).toHaveCount(0);
        await expect(reorder).toBeEnabled();
        await reorder.click();
        const done = header.getByRole('button', { name: 'Done', exact: true });
        await expect(done).toHaveAttribute('aria-pressed', 'true');
        await done.click();
        await expect(reorder).toHaveAttribute('aria-pressed', 'false');
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      }
      if (width === 1440 || width === 390) {
        await expect(page.locator(`#content a[href="${MOVIE_PATH}"]`).first()).toBeVisible({ timeout: 15_000 });
        await page.screenshot({ path: testInfo.outputPath(`watched-${width}.png`), animations: 'disabled', style: 'nextjs-portal { display: none !important; }' });
      }
    });
  });
}
