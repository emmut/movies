import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1440]) {
  test.describe(`Pagination at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test('keeps controls on one row with usable mobile targets', async ({ page }, testInfo) => {
      await page.goto('/discover?genreId=28&page=10');
      const pagination = page.getByRole('navigation', { name: 'pagination', exact: true });
      await expect(pagination).toBeVisible();
      await pagination.scrollIntoViewIfNeeded();

      const layout = await pagination.evaluate((element) => {
        const controls = [...element.querySelectorAll('a, input')].filter((control) =>
          control.checkVisibility(),
        );
        return {
          bounds: element.getBoundingClientRect().toJSON(),
          controls: controls.map((control) => control.getBoundingClientRect().toJSON()),
          overflowing: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(layout.overflowing).toBe(false);
      const centers = layout.controls.map((control) => control.y + control.height / 2);
      expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(1);
      for (const control of layout.controls) {
        expect(control.x).toBeGreaterThanOrEqual(layout.bounds.x);
        expect(control.x + control.width).toBeLessThanOrEqual(
          layout.bounds.x + layout.bounds.width,
        );
        if (width < 640) {
          expect(control.height).toBeGreaterThanOrEqual(44);
          expect(control.width).toBeGreaterThanOrEqual(44);
        }
      }

      const input = page.getByRole('spinbutton', { name: 'Page number' }).filter({ visible: true });
      await expect(input).toHaveValue('10');
      const totalPages = Number(await input.getAttribute('max'));
      expect(totalPages).toBeGreaterThan(11);
      if (width < 1024) {
        await expect(pagination.locator('a').filter({ visible: true })).toHaveCount(2);
        await expect(pagination.getByRole('spinbutton')).toBeVisible();
      } else {
        await expect(pagination.locator('[aria-current="page"]')).toHaveText('10');
        await expect(pagination.getByRole('spinbutton')).not.toBeVisible();
      }
      if (width === 390) {
        await expect(page.locator('#content a[href^="/movie/"]').first()).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath('pagination-mobile.png') });
      }

      if (width !== 390 && width !== 1440) {
        return;
      }

      await pagination.getByRole('button', { name: 'Go to next page' }).click();
      await expect(page).toHaveURL(/page=11/);
      await expect(input).toHaveValue('11');
      await pagination.getByRole('button', { name: 'Go to previous page' }).click();
      await expect(page).toHaveURL(/page=10/);
      await expect(input).toHaveValue('10');

      for (const invalidPage of ['0', String(totalPages + 1), '1.5', '']) {
        await input.fill(invalidPage);
        await input.press('Enter');
        await expect(input).toHaveValue('10');
        await expect(page).toHaveURL(/page=10/);
      }
      await input.fill('20');
      await input.press('Escape');
      await expect(input).toHaveValue('10');
      await expect(page).toHaveURL(/page=10/);

      await input.fill(String(totalPages));
      await input.press('Enter');
      await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBe(String(totalPages));
      await expect(input).toHaveValue(String(totalPages));
      await expect(pagination.getByRole('button', { name: 'Go to next page' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );

      await input.fill('1');
      await input.press('Tab');
      await expect(page).toHaveURL(/page=1(?:&|$)/);
      await expect(input).toHaveValue('1');
      await expect(pagination.getByRole('button', { name: 'Go to previous page' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await expect(page).toHaveURL(/genreId=28/);
    });
  });
}
