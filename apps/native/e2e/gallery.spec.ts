import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
} from '@native/e2e/catalog-fixtures';
import { expect, test, type Locator } from '@playwright/test';

async function translate(locator: Locator, axis: 'x' | 'y' = 'x') {
  return locator.evaluate((element, key) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return key === 'x' ? matrix.m41 : matrix.m42;
  }, axis);
}

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

test('preloads adjacent images and supports keyboard focus, wrapping, Home/End and Escape', async ({
  page,
}) => {
  const dialog = page.getByRole('dialog', { name: 'Media gallery' });
  await expect(dialog).toHaveAccessibleDescription(/Left and Right.*Home.*End.*Escape/);
  const track = page.getByTestId('gallery-image-track');
  await expect(track.getByRole('img')).toHaveCount(1);
  await expect(track.getByRole('img')).toBeVisible();
  expect((await track.getByRole('img').boundingBox())!.height).toBeGreaterThan(100);
  await expect(track.locator('img')).toHaveCount(3);
  for (const image of await track.locator('img').all()) {
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0);
  }
  await expect(dialog.getByRole('button', { name: 'Close media viewer' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Next media' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close media viewer' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Previous media' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Next media' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close media viewer' })).toBeFocused();
  await page.keyboard.press('End');
  await expect(dialog.getByText('3 / 3', { exact: true })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByText('1 / 3', { exact: true })).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.getByText('3 / 3', { exact: true })).toBeVisible();
  await page.keyboard.press('Home');
  await expect(dialog.getByText('1 / 3', { exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/movies-native-gallery.png' });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeAttached();
  await expect(page.getByRole('button', { name: 'Open image 1 of 3', exact: true })).toBeFocused();
});

test('a single failed image has a usable fallback and disabled paging in dark appearance', async ({
  page,
}) => {
  await page.keyboard.press('Escape');
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
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByText('1 / 1', { exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/movies-native-gallery-dark.png' });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeAttached();
});

test('tracks horizontal drags, snaps short drags back, and navigates deliberate swipes', async ({
  page,
}) => {
  const area = page.getByTestId('gallery-pan-area');
  const track = page.getByTestId('gallery-image-track');
  const bounds = (await area.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await expect.poll(() => translate(track)).toBeCloseTo(-bounds.width, 0);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y, { steps: 4 });
  await expect.poll(() => translate(track)).toBeCloseTo(-bounds.width + 40, 0);
  await page.mouse.up();
  await expect.poll(() => translate(track)).toBeCloseTo(-bounds.width, 0);
  await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 100, y, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByText('2 / 3', { exact: true })).toBeVisible();
});

test('a grabbed slide retains its pixels and does not advance twice', async ({ page }) => {
  const area = page.getByTestId('gallery-pan-area');
  const track = page.getByTestId('gallery-image-track');
  const bounds = (await area.boundingBox())!;
  const image = track.locator('img[alt="Image 2"]');
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.keyboard.press('ArrowRight');
  await page.clock.runFor(90);
  const before = (await image.boundingBox())!.x;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await expect(page.getByText('2 / 3', { exact: true })).toBeVisible();
  expect((await image.boundingBox())!.x).toBeCloseTo(before, 0);
  await page.mouse.move(bounds.x + bounds.width / 2 + 20, bounds.y + bounds.height / 2);
  await page.clock.runFor(17);
  expect((await image.boundingBox())!.x).toBeCloseTo(before + 20, 0);
  await page.mouse.up();
  await page.clock.runFor(400);
  await expect.poll(() => translate(track)).toBeCloseTo(-bounds.width, 0);
  await expect(page.getByText('2 / 3', { exact: true })).toBeVisible();
});

test('downward touch drags move the whole viewer, fade the backdrop, cancel, and dismiss without flashing back', async ({
  page,
}) => {
  const area = page.getByTestId('gallery-pan-area');
  const surface = page.getByTestId('gallery-surface');
  const overlay = page.getByTestId('gallery-backdrop');
  const bounds = (await area.boundingBox())!;
  const startY = bounds.y + bounds.height / 3;
  const height = page.viewportSize()!.height;
  const client = await page.context().newCDPSession(page);
  async function touch(
    type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel',
    offset?: number,
  ) {
    await client.send('Input.dispatchTouchEvent', {
      type,
      touchPoints:
        offset === undefined ? [] : [{ x: bounds.x + bounds.width / 2, y: startY + offset }],
    });
  }
  const header = page.getByRole('heading', { name: 'Test movie — Images' });
  const top = (await header.boundingBox())!.y;
  await touch('touchStart', 0);
  await touch('touchMove', 40);
  await expect.poll(() => translate(surface, 'y')).toBeCloseTo(40, 0);
  expect((await header.boundingBox())!.y).toBeCloseTo(top + 40, 0);
  await expect
    .poll(() => overlay.evaluate((el) => Number(getComputedStyle(el).opacity)))
    .toBeCloseTo(1 - 40 / height, 2);
  await touch('touchEnd');
  await expect.poll(() => translate(surface, 'y')).toBeCloseTo(0, 0);
  await touch('touchStart', 0);
  await touch('touchMove', 150);
  await touch('touchCancel');
  await expect.poll(() => translate(surface, 'y')).toBeCloseTo(0, 0);
  await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
  await touch('touchStart', 0);
  await touch('touchMove', 150);
  await touch('touchEnd');
  await expect(surface).not.toBeAttached();
  const trigger = page.getByRole('button', { name: 'Open image 1 of 3', exact: true });
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect.poll(() => translate(page.getByTestId('gallery-surface'), 'y')).toBe(0);
  await client.detach();
});

test('ignores downward mouse drags and resolves navigation when reduced motion changes', async ({
  page,
}) => {
  const bounds = (await page.getByTestId('gallery-pan-area').boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 3;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 150, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => translate(page.getByTestId('gallery-surface'), 'y')).toBe(0);
  await page.keyboard.press('ArrowRight');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByText('2 / 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next media' }).click();
  await expect(page.getByText('3 / 3', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('gallery-surface')).not.toBeAttached();
});
