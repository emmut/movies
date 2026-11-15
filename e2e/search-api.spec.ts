import { expect, test } from '@playwright/test';

for (const [genreId, retained] of [['28', false], ['35', true]] as const) {
  test(`search type changes validate genre ${genreId} through the shared API`, async ({ page }) => {
    await page.goto(`/search?q=alien&mediaType=movie&genreId=${genreId}`);
    const options = page.waitForResponse((response) =>
      new URL(response.url()).pathname === '/api/rpc/discovery/options' && response.ok(),
    );
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'TV Shows', exact: true }).click();
    await options;
    await expect(page).toHaveURL(/mediaType=tv/);
    const params = new URL(page.url()).searchParams;
    expect(params.get('q')).toBe('alien');
    expect(params.get('genreId')).toBe(retained ? genreId : null);
  });
}

test('an unknown search media type retains the All selector fallback', async ({ page }) => {
  await page.goto('/search?q=alien&mediaType=unknown');
  await expect(page.getByRole('combobox').locator('[data-slot="select-value"]')).toHaveText('All');
  await page.getByRole('combobox').click();
  await expect(page.getByRole('option', { name: 'TV Shows', exact: true })).toBeVisible();
});
