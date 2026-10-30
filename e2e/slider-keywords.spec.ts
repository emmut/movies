import { expect, test } from '@playwright/test';

import { MOVIE_PATH, openDiscoverFilters } from './helpers';

test.setTimeout(60_000);

for (const width of [1280, 390]) {
  test.describe(`Slider edges at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('clears the fade at both ends of images, seasons and cast', async ({ page }) => {
      await page.goto('/tv/1668');
      for (const name of [/^Images/, /^Seasons & Episodes/, /^Cast$/]) {
        const section = page.getByRole('heading', { name }).first().locator('..');
        const track = section.getByRole('application').first();
        await track.scrollIntoViewIfNeeded();
        const slider = track.locator('..');
        const startFade = slider.locator('[data-slot="slider-fade-start"]');
        const endFade = slider.locator('[data-slot="slider-fade-end"]');

        await track.evaluate((element) => element.scrollTo({ left: 0, behavior: 'instant' }));
        await expect(startFade).toHaveCount(0);
        await expect(endFade).toHaveCount(1);

        await track.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: 'instant' }));
        await expect(endFade).toHaveCount(0);
        await expect(startFade).toHaveCount(1);

        await track.evaluate((element) => element.scrollTo({ left: 0, behavior: 'instant' }));
        await expect(startFade).toHaveCount(0);
        await expect(endFade).toHaveCount(1);
      }
    });
  });
}

test('rechecks fades when resizing removes or restores overflow', async ({ page }) => {
  await page.goto('/tv/1668');
  const track = page.getByRole('heading', { name: /^Seasons & Episodes/ }).locator('..').getByRole('application');
  await track.scrollIntoViewIfNeeded();
  const slider = track.locator('..');
  await expect(slider.locator('[data-slot="slider-fade-end"]')).toHaveCount(1);
  await track.evaluate((element) => { element.style.width = `${element.scrollWidth}px`; });
  await expect(slider.locator('[data-slot^="slider-fade-"]')).toHaveCount(0);
  await track.evaluate((element) => { element.style.width = ''; });
  await expect(slider.locator('[data-slot="slider-fade-end"]')).toHaveCount(1);
});

test('keyword bubbles open Discover with a removable named filter', async ({ page }) => {
  await page.goto(MOVIE_PATH);
  await page.getByRole('button', { name: 'Show tags', exact: true }).click();
  const keyword = page.locator('a[href^="/discover?keywordId="]').first();
  const href = await keyword.getAttribute('href');
  const name = await keyword.innerText();
  await keyword.click();
  await expect(page).toHaveURL(new RegExp(href!.replace(/[?]/g, '\\?')), { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeVisible();
  await openDiscoverFilters(page);
  const remove = page.getByRole('button', { name: `Remove keyword ${name}`, exact: true });
  await expect(remove).toBeVisible();
  await expect(page.locator('#content a[href^="/movie/"]').first()).toBeVisible();
  await remove.click();
  await expect(page).not.toHaveURL(/keywordId=/);
  await expect(remove).toHaveCount(0);
  await page.goBack();
  await openDiscoverFilters(page);
  await expect(remove).toBeVisible();
});

test('Discover keyword links retain the keyword through paging and media changes', async ({ page }) => {
  await page.goto('/discover?keywordId=818&mediaType=movie&page=2');
  await expect(page).toHaveURL(/\/discover\?keywordId=818&mediaType=movie&page=2/, { timeout: 15_000 });
  await openDiscoverFilters(page);
  await expect(page.getByRole('button', { name: /^Remove keyword / })).toBeVisible();
  await page.getByRole('button', { name: 'Show results', exact: true }).click();
  await expect(page.locator('#content a[href^="/movie/"]').first()).toBeVisible();
  await page.getByRole('button', { name: /go to next page/i }).click();
  await expect(page).toHaveURL(/page=3/);
  expect(new URL(page.url()).searchParams.get('keywordId')).toBe('818');
  await page.getByRole('button', { name: 'TV Shows', exact: true }).click();
  await expect(page).toHaveURL(/mediaType=tv/);
  expect(new URL(page.url()).searchParams.get('keywordId')).toBe('818');
  expect(new URL(page.url()).searchParams.get('page') ?? '1').toBe('1');
  await expect(page.locator('#content a[href^="/tv/"]').first()).toBeVisible();
});

test('Clear all removes keyword filters too', async ({ page }) => {
  await page.goto('/discover?keywordId=818');
  await openDiscoverFilters(page);
  await expect(page.getByRole('button', { name: /^Remove keyword / })).toBeVisible();
  await page.getByRole('button', { name: 'Clear all', exact: true }).filter({ visible: true }).click();
  await expect(page).not.toHaveURL(/keywordId=/);
  await expect(page.getByRole('button', { name: /^Remove keyword / })).toHaveCount(0);
});
