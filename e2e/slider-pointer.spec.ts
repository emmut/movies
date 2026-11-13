import { expect, test } from '@playwright/test';

test.setTimeout(60_000);

for (const input of ['mouse', 'hybrid', 'touch'] as const) {
  test(`season slider supports ${input} input`, async ({ page }) => {
    if (input !== 'mouse') {
      await page.addInitScript(({ fine }) => {
        const original = window.matchMedia.bind(window);
        window.matchMedia = function (query) {
          const result = original(query);
          if (/\((any-)?(hover|pointer):/.test(query)) {
            Object.defineProperty(result, 'matches', {
              value: query === '(any-pointer: fine)' && fine,
            });
          }
          return result;
        };
      }, { fine: input === 'hybrid' });
    }
    await page.goto('/tv/1668');
    const section = page.getByRole('heading', { name: /^Seasons & Episodes/ }).locator('..');
    const track = section.getByRole('application');
    await track.scrollIntoViewIfNeeded();
    const next = section.getByRole('button', { name: 'Next slide', exact: true });
    const previous = section.getByRole('button', { name: 'Previous slide', exact: true });

    // Every item slider provides the same snap alignment.
    const cards = track.locator('a');
    await expect(track).toHaveCSS('scroll-snap-type', 'x mandatory');
    await expect(cards.first()).toBeVisible();
    expect(await cards.evaluateAll((elements) => elements.every((element) => getComputedStyle(element).scrollSnapAlign === 'start'))).toBe(true);

    if (input === 'touch') {
      await expect(next).toHaveCount(0);
      await expect(previous).toHaveCount(0);
      await track.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      await expect(previous).toHaveCount(0);
    } else {
      await expect(next).toBeVisible();
      await expect(previous).toHaveCount(0);
      await next.click();
      await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      await expect(previous).toBeVisible();
      await expect.poll(() => track.evaluate((element) => {
        const padding = Number.parseFloat(getComputedStyle(element).scrollPaddingLeft);
        const bounds = element.getBoundingClientRect();
        const atEnd = Math.abs(element.scrollLeft - (element.scrollWidth - element.clientWidth)) < 2;
        return atEnd || Array.from(element.children).some((child) =>
          Math.abs(child.getBoundingClientRect().left - bounds.left - padding) < 2);
      })).toBe(true);
      await track.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: 'instant' }));
      await expect(next).toHaveCount(0);
      await previous.click();
      await expect(next).toBeVisible();
    }
  });
}

test('images, seasons and cast follow mouse drags before snapping on release', async ({ page }) => {
  await page.goto('/tv/1668');
  for (const name of [/^Images/, /^Seasons & Episodes/, /^Cast$/]) {
    const section = page.getByRole('heading', { name }).first().locator('..');
    const track = section.getByRole('application').first();
    await track.scrollIntoViewIfNeeded();
    await expect(track).toHaveCSS('scroll-snap-type', 'x mandatory');
    await expect.poll(() => track.locator(':scope > *').evaluateAll((items) =>
      items.length > 0 && items.every((item) => getComputedStyle(item).scrollSnapAlign === 'start'))).toBe(true);
    // Clicking a real control waits for hydration before sending drag events.
    await section.getByRole('button', { name: 'Next slide', exact: true }).first().click();
    await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await track.evaluate((element) => element.scrollTo({ left: 0, behavior: 'instant' }));
    await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBe(0);
    const box = await track.boundingBox();
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 47, y, { steps: 5 });
    await expect(track).toHaveCSS('scroll-snap-type', 'none');
    await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBe(47);
    await page.mouse.up();
    await expect(track).toHaveCSS('scroll-snap-type', 'x mandatory');
    await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBe(0);
  }
});
