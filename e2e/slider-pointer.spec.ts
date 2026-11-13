import { expect, test } from '@playwright/test';

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

    // Season cards must allow free scrolling, like cast cards.
    const cards = track.locator('a');
    await expect(cards.first()).toBeVisible();
    expect(await cards.evaluateAll((elements) => elements.every((element) => getComputedStyle(element).scrollSnapAlign === 'none'))).toBe(true);

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
      await track.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: 'instant' }));
      await expect(next).toHaveCount(0);
      await previous.click();
      await expect(next).toBeVisible();
    }
  });
}
