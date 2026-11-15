import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
} from '@native/e2e/catalog-fixtures';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('https://image.tmdb.org/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#345"/><circle cx="400" cy="225" r="100" fill="#fac800"/></svg>',
    }),
  );
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ headers: corsHeaders, json: { json: detailFixture('movie') } });
  });
  await page.route('**/rpc/catalog/extras*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      headers: corsHeaders,
      json: {
        json: {
          companies: [],
          networks: [],
          collection: null,
          images: [
            { file_path: '/one.jpg' },
            { file_path: '/two.jpg' },
            { file_path: '/three.jpg' },
          ],
          videos: [],
          keywords: [],
          releases: [],
          seasons: [],
          next: null,
          latest: null,
        },
      },
    });
  });
  await page.goto('/movie/42?region=US');
  await page.getByRole('button', { name: 'Open image 1 of 3', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Media gallery' })).toBeVisible();
});

test('browser preview pages through images, wraps, and restores focus on close', async ({
  page,
}) => {
  const dialog = page.getByRole('dialog', { name: 'Media gallery' });
  const image = dialog.getByRole('img', { name: 'Image 1', exact: true });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0);
  await dialog.getByRole('button', { name: 'Previous media' }).click();
  await expect(dialog.getByText('3 / 3', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('img', { name: 'Image 3', exact: true })).toBeVisible();
  await expect(dialog.getByRole('img', { name: /^Image / })).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Next media' }).click();
  await expect(dialog.getByText('1 / 3', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close media viewer' }).click();
  await expect(dialog).not.toBeAttached();
  const trigger = page.getByRole('button', { name: 'Open image 2 of 3', exact: true });
  await trigger.click();
  await expect(dialog.getByText('2 / 3', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeAttached();
  await expect(trigger).toBeFocused();
});

test('browser preview keeps paging controls usable in a short viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 360 });
  const dialog = page.getByRole('dialog', { name: 'Media gallery' });
  for (const name of ['Previous media', 'Next media']) {
    const bounds = (await dialog.getByRole('button', { name }).boundingBox())!;
    expect(bounds.width).toBeGreaterThanOrEqual(48);
    expect(bounds.height).toBeGreaterThanOrEqual(48);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(360);
  }
  await dialog.getByRole('button', { name: 'Next media' }).click();
  await expect(dialog.getByText('2 / 3', { exact: true })).toBeVisible();
});

test('a failed image keeps a fallback and disables paging for a single item', async ({ page }) => {
  await page.getByRole('button', { name: 'Close media viewer' }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.route('https://image.tmdb.org/**', (route) => route.abort());
  await page.route('**/rpc/catalog/extras*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      headers: corsHeaders,
      json: {
        json: {
          companies: [],
          networks: [],
          collection: null,
          images: [{ file_path: '/failed.jpg' }],
          videos: [],
          keywords: [],
          releases: [],
          seasons: [],
          next: null,
          latest: null,
        },
      },
    });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Open image 1 of 1', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Media gallery' });
  await expect(dialog.getByText('No image available')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Next media' })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: 'Previous media' })).toBeDisabled();
});
