import { expect, test } from '@playwright/test';

import { MOVIE_PATH } from './helpers';

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`PDP media at ${viewport.width}px`, () => {
    test.use({ viewport });

    test('clips keyword silhouettes and reveals navigable tags on demand', async ({ page }) => {
      await page.goto(MOVIE_PATH);
      const toggle = page.getByRole('button', { name: 'Show tags', exact: true });
      await expect(toggle).toBeVisible();
      const contentId = await toggle.getAttribute('aria-controls');
      const keywords = page.locator(`[id="${contentId}"]`);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(keywords).toHaveAttribute('inert', '');
      await expect(keywords.getByRole('link')).toHaveCount(0);
      expect((await keywords.boundingBox())!.height).toBeLessThanOrEqual(80);
      await toggle.click();
      await expect(page.getByRole('button', { name: 'Hide tags' })).toHaveAttribute('aria-expanded', 'true');
      await expect(keywords.getByRole('link').first()).toBeVisible();
      await page.getByRole('button', { name: 'Hide tags' }).click();
      await expect(keywords.getByRole('link')).toHaveCount(0);
    });

    test('opens a fullscreen image carousel with keyboard navigation and focus restoration', async ({ page }) => {
      await page.goto(MOVIE_PATH);
      const openImage = page.getByRole('button', { name: /^Open image 1 of/ });
      await openImage.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('img', { name: 'Image 1', exact: true })).toBeVisible();
      await expect.poll(
        () => dialog.getByRole('img', { name: 'Image 1', exact: true }).evaluate((image: HTMLImageElement) => image.naturalWidth),
        { timeout: 15_000 },
      ).toBeGreaterThan(0);
      await expect.poll(async () => {
        const bounds = await dialog.boundingBox();
        return { width: Math.round(bounds?.width ?? 0), height: Math.round(bounds?.height ?? 0) };
      }).toEqual(viewport);
      await page.keyboard.press('ArrowRight');
      await expect(dialog.getByRole('img', { name: 'Image 2', exact: true })).toBeVisible();
      await dialog.getByRole('button', { name: 'Previous media' }).click();
      await expect(dialog.getByRole('img', { name: 'Image 1', exact: true })).toBeVisible();
      if (viewport.width === 390) {
        const client = await page.context().newCDPSession(page);
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 280, y: 400 }] });
        await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 80, y: 400 }] });
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expect(dialog.getByRole('img', { name: 'Image 2', exact: true })).toBeVisible();
        await client.detach();
      }
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(openImage).toBeFocused();
    });

    test('browses all videos through the trailer button and removes players on close', async ({ page }) => {
      await page.route('https://www.youtube-nocookie.com/embed/**', (route) => route.fulfill({ contentType: 'text/html', body: '<p>Video player</p>' }));
      await page.goto(MOVIE_PATH);
      const trailer = page.getByRole('button', { name: /^Play Trailer/ });
      await expect(page.locator('iframe')).toHaveCount(0);
      await trailer.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.locator('iframe')).toHaveCount(1);
      const firstVideo = await dialog.locator('iframe').getAttribute('src');
      await dialog.getByRole('button', { name: 'Next media' }).click();
      await expect(dialog.locator('iframe')).toHaveCount(1);
      await expect(dialog.locator('iframe')).not.toHaveAttribute('src', firstVideo!);
      await dialog.getByRole('button', { name: 'Close media viewer' }).click();
      await expect(page.locator('iframe')).toHaveCount(0);
      await expect(trailer).toBeFocused();
    });
  });
}
