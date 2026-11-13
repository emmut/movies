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
      await expect(dialog.locator('[aria-busy="false"]').filter({ has: page.getByRole('img', { name: 'Image 1', exact: true }) })).toHaveCount(1);
      const nextImage = await dialog.locator('img[alt="Image 2"]').elementHandle();
      // Only the active full-size image and its neighbors are loaded.
      await expect(dialog.locator('img')).toHaveCount(3);
      await expect(dialog.locator('figure[aria-hidden="false"]')).toHaveCount(1);
      for (const neighbor of await dialog.locator('figure[aria-hidden="true"] img').all()) {
        await expect.poll(() => neighbor.evaluate((image: HTMLImageElement) => image.naturalWidth), { timeout: 15_000 }).toBeGreaterThan(0);
      }
      const track = dialog.locator('[data-slot="media-image-track"]');
      await page.keyboard.press('ArrowRight');
      const slideAfterStaleEvents = await track.evaluate(async (element) => {
        // Pause the slide to check that child fades and stale cancellations cannot complete it.
        for (const animation of element.getAnimations()) {
          animation.pause();
        }
        element.querySelector('img')!.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }));
        element.dispatchEvent(new TransitionEvent('transitioncancel', { bubbles: true, propertyName: 'transform' }));
        await new Promise(requestAnimationFrame);
        return element.querySelector('figure[aria-hidden="false"]')?.getAttribute('aria-label');
      });
      expect(slideAfterStaleEvents).toBe('Image 1');
      await track.dispatchEvent('transitionend', { propertyName: 'transform' });
      await expect(dialog.getByRole('img', { name: 'Image 2', exact: true })).toBeVisible();
      expect(await nextImage!.evaluate((image) => image.isConnected)).toBe(true);
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
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await dialog.getByRole('button', { name: 'Next media' }).click();
      await expect(dialog.getByRole('img', { name: viewport.width === 390 ? 'Image 3' : 'Image 2', exact: true })).toBeVisible();
      expect(await track.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe('0s');
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(openImage).toBeFocused();
    });

    test('keeps a held drag attached and lets it resume during snap-back', async ({ page }) => {
      await page.goto(MOVIE_PATH);
      await page.getByRole('button', { name: /^Open image 1 of/ }).click();
      const track = page.locator('[data-slot="media-image-track"]');
      const width = await track.evaluate((element) => element.clientWidth);
      const bounds = (await track.locator('figure[aria-hidden="false"]').boundingBox())!;
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 40, y, { steps: 4 });
      await expect.poll(() => track.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)).toBeCloseTo(-width + 40, 0);
      const dragged = await track.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
      await page.waitForTimeout(350);
      expect(await track.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)).toBeCloseTo(dragged, 0);
      await page.mouse.up();
      // Freeze the return halfway through, then grab exactly where it is displayed.
      const before = await track.evaluate((el) => {
        for (const animation of el.getAnimations()) {
          animation.pause();
          animation.currentTime = 100;
        }
        return new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
      });
      await page.mouse.down();
      expect(await track.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)).toBeCloseTo(before, 0);
      await page.mouse.move(x + 20, y);
      await expect.poll(() => track.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)).toBeCloseTo(before - 20, 0);
      await page.mouse.up();
      await expect.poll(() => track.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)).toBeCloseTo(-width, 0);
    });

    test('grabs a navigating slide without jumping or advancing twice', async ({ page }) => {
      await page.goto(MOVIE_PATH);
      await page.getByRole('button', { name: /^Open image 1 of/ }).click();
      const dialog = page.getByRole('dialog');
      await dialog.evaluate(async (element) => {
        await Promise.all(element.getAnimations().map((animation) => animation.finished));
      });
      const track = dialog.locator('[data-slot="media-image-track"]');
      const width = await track.evaluate((element) => element.clientWidth);
      const image = track.locator('figure[aria-label="Image 2"]');
      const bounds = (await track.locator('figure[aria-hidden="false"]').boundingBox())!;
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height / 2;
      await page.mouse.move(x, y);
      // Pause JS time so the 350ms navigation fallback cannot race the grab.
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      await page.keyboard.press('ArrowRight');
      await track.evaluate((element) => {
        for (const animation of element.getAnimations()) {
          animation.pause();
          animation.currentTime = 100;
        }
      });
      await expect(track.locator('figure[aria-hidden="false"]')).toHaveAttribute('aria-label', 'Image 1');
      const before = (await image.boundingBox())!.x;
      await page.mouse.down();
      await expect(track.locator('figure[aria-hidden="false"]')).toHaveAttribute('aria-label', 'Image 2');
      expect((await image.boundingBox())!.x).toBeCloseTo(before, 0);
      await page.mouse.move(x + 20, y);
      await page.clock.runFor(17);
      expect((await image.boundingBox())!.x).toBeCloseTo(before + 20, 0);
      await page.mouse.up();
      await page.clock.runFor(400);
      await expect.poll(() => track.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)).toBeCloseTo(-width, 0);
      await expect(track.locator('figure[aria-hidden="false"]')).toHaveAttribute('aria-label', 'Image 2');
    });

    test('supports keyboard navigation, focus containment and screen-reader context', async ({ page }) => {
      await page.goto(MOVIE_PATH);
      const trigger = page.getByRole('button', { name: /^Open image 1 of/ });
      const count = Number((await trigger.getAttribute('aria-label'))!.match(/of (\d+)/)![1]);
      await trigger.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(/Images|Gallery/);
      await expect(dialog).toHaveAccessibleDescription(/Left and Right arrow keys.*Home.*End.*Escape/);
      const close = dialog.getByRole('button', { name: 'Close media viewer' });
      const previous = dialog.getByRole('button', { name: 'Previous media' });
      const next = dialog.getByRole('button', { name: 'Next media' });
      await expect(close).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(previous).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(next).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(close).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(next).toBeFocused();
      const active = dialog.locator('figure[aria-hidden="false"]');
      await page.keyboard.press('End');
      await expect(active).toHaveAttribute('aria-label', `Image ${count}`);
      await expect(dialog.locator('[aria-live="polite"]')).toContainText(`${count} of ${count}`);
      await page.keyboard.press('ArrowRight');
      await expect(active).toHaveAttribute('aria-label', 'Image 1');
      await page.keyboard.press('ArrowLeft');
      await expect(active).toHaveAttribute('aria-label', `Image ${count}`);
      await page.keyboard.press('Home');
      await expect(active).toHaveAttribute('aria-label', 'Image 1');
      await expect(dialog.locator('figure[aria-hidden="true"]:not([inert])')).toHaveCount(0);
      await expect(next).toBeFocused();
      await page.keyboard.press('Space');
      await expect(active).toHaveAttribute('aria-label', 'Image 2');
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
    });

    test('ignores downward mouse drags and closes with Escape', async ({ page }) => {
      await page.goto(MOVIE_PATH);
      const trigger = page.getByRole('button', { name: /^Open image 1 of/ });
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await dialog.evaluate(async (element) => {
        await Promise.all(element.getAnimations().map((animation) => animation.finished));
      });
      const slide = dialog.locator('figure[aria-hidden="false"]');
      const bounds = (await slide.boundingBox())!;
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y + 150, { steps: 5 });
      expect(await dialog.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(0);
      await page.mouse.up();
      await expect(dialog).toBeVisible();
      await expect(slide).toHaveAttribute('aria-label', 'Image 1');
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
    });

    test('tracks downward drags and closes only after a completed swipe', async ({ page }) => {
      await page.goto(MOVIE_PATH);
      const trigger = page.getByRole('button', { name: /^Open image 1 of/ });
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await dialog.evaluate(async (element) => {
        await Promise.all(element.getAnimations().map((animation) => animation.finished));
      });
      const surface = dialog;
      const overlay = page.locator('[data-slot="dialog-overlay"]');
      const client = await page.context().newCDPSession(page);
      async function touch(type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', y?: number) {
        await client.send('Input.dispatchTouchEvent', {
          type,
          touchPoints: y === undefined ? [] : [{ x: viewport.width / 2, y }],
        });
      }
      const header = dialog.getByRole('heading');
      const controls = dialog.getByRole('button', { name: 'Next media' });
      const headerTop = (await header.boundingBox())!.y;
      const controlsTop = (await controls.boundingBox())!.y;
      await touch('touchStart', 300);
      await touch('touchMove', 340);
      await expect.poll(() => surface.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeCloseTo(40, 0);
      await expect.poll(() => overlay.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeCloseTo(1 - 40 / viewport.height, 2);
      expect((await header.boundingBox())!.y).toBeCloseTo(headerTop + 40, 0);
      expect((await controls.boundingBox())!.y).toBeCloseTo(controlsTop + 40, 0);
      await touch('touchEnd');
      await expect.poll(() => surface.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeCloseTo(0, 0);
      await expect(dialog).toBeVisible();
      await expect.poll(() => overlay.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeCloseTo(1, 2);
      await touch('touchStart', 300);
      await touch('touchMove', 450);
      await touch('touchCancel');
      await expect(dialog).toBeVisible();
      await expect.poll(() => surface.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeCloseTo(0, 0);
      await touch('touchStart', 300);
      await touch('touchMove', 450);
      await expect(dialog).toBeVisible();
      // Observe the closed panel too: its default exit keyframes must not
      // override the offscreen swipe transform and flash it back into view.
      const frames = dialog.evaluate((element) => new Promise<{ closed: boolean; top: number; opacity: number }[]>((resolve) => {
        const samples: { closed: boolean; top: number; opacity: number }[] = [];
        function sample() {
          if (!element.isConnected) {
            resolve(samples);
            return;
          }
          const backdrop = document.querySelector('[data-slot="dialog-overlay"]');
          const opacity = backdrop ? Number(getComputedStyle(backdrop).opacity) : 0;
          samples.push({ closed: element.hasAttribute('data-closed'), top: element.getBoundingClientRect().top, opacity });
          requestAnimationFrame(sample);
        }
        sample();
      }));
      await touch('touchEnd');
      expect(await overlay.evaluate((element) => getComputedStyle(element).transitionTimingFunction)).toBe('cubic-bezier(0.55, 0, 1, 0.45)');
      const samples = await frames;
      expect(samples.some((sample) => sample.top >= viewport.height - 1)).toBe(true);
      expect(samples.filter((sample) => sample.closed && sample.top < viewport.height - 1)).toEqual([]);
      expect(samples.filter((sample) => sample.closed && sample.opacity > 0.01)).toEqual([]);
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(dialog).toBeVisible();
      await expect.poll(() => dialog.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBeCloseTo(0, 0);
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await client.detach();
    });

    test('keeps navigation working when reduced motion interrupts a slide', async ({ page }) => {
      await page.goto(MOVIE_PATH);
      await page.getByRole('button', { name: /^Open image 1 of/ }).click();
      const dialog = page.getByRole('dialog');
      await page.keyboard.press('ArrowRight');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(dialog.getByRole('img', { name: 'Image 2', exact: true })).toBeVisible();
      await dialog.getByRole('button', { name: 'Next media' }).click();
      await expect(dialog.getByRole('img', { name: 'Image 3', exact: true })).toBeVisible();
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
