import { corsHeaders, mockEmptySupport, preflight } from '@native/e2e/catalog-fixtures';
import { expect, test } from '@playwright/test';

const title = {
  id: 42,
  type: 'movie',
  title: 'A very long movie title for a small screen',
  releaseDate: '2026-10-10',
  posterUrl: 'https://image.tmdb.org/broken-poster.jpg',
  backdropUrl: 'https://image.tmdb.org/broken-backdrop.jpg',
  rating: 8.2,
};

test.beforeEach(mockEmptySupport);

for (const theme of ['light', 'dark'] as const) {
  test(`featured titles remain readable and actionable with failed artwork in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.route('https://image.tmdb.org/**', (route) => route.abort());
    await page.route('**/rpc/home/*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      await route.fulfill({ headers: corsHeaders, json: { json: [title] } });
    });
    await page.goto('/');
    const featured = page.getByRole('link', { name: `Open ${title.title}, Movie` }).first();
    await expect(featured.getByText('No image available')).toBeVisible();
    await expect(featured.getByText(title.title, { exact: true })).toBeVisible();
    await expect(featured.getByText('Explore title', { exact: true })).toBeVisible();
    const bounds = (await featured.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    await page
      .getByRole('button', { name: `Quick add ${title.title}`, exact: true })
      .first()
      .click();
    await expect(page.getByRole('button', { name: 'Close quick add', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close quick add', exact: true }).click();
    await expect(featured).toBeVisible();
    await page.screenshot({ path: `/tmp/native-home-polish-${theme}.png` });
  });
}

test('featured loading placeholders reserve the loaded card height', async ({ page }) => {
  let showTitles = () => {};
  const ready = new Promise<void>((resolve) => {
    showTitles = resolve;
  });
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await ready;
    await route.fulfill({
      headers: corsHeaders,
      json: { json: [{ ...title, posterUrl: null, backdropUrl: null }] },
    });
  });
  await page.goto('/');
  const placeholder = page
    .getByRole('progressbar', { name: 'Loading titles', exact: true })
    .first();
  await expect(placeholder).toBeVisible();
  const before = (await placeholder.boundingBox())!;
  showTitles();
  const featured = page.getByRole('link', { name: `Open ${title.title}, Movie` }).first();
  await expect(featured).toBeVisible();
  const after = (await featured.boundingBox())!;
  expect(after.height).toBe(before.height);
  expect(after.y).toBe(before.y);
});
