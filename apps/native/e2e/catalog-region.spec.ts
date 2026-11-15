import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
} from '@native/e2e/catalog-fixtures';
import { expect, test } from '@playwright/test';

test('genre actions preserve the title watch region instead of reverting to the account region', async ({
  page,
}) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ headers: corsHeaders, json: { json: detailFixture('movie') } });
  });
  await page.route('**/rpc/discovery/options*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      headers: corsHeaders,
      json: { json: { genres: [{ id: 12, name: 'Adventure' }], providers: [], countries: [] } },
    });
  });
  await page.route('**/rpc/discovery/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      headers: corsHeaders,
      json: { json: { items: [], totalPages: 0, totalResults: 0 } },
    });
  });
  await page.goto('/movie/42?region=US');
  await page.getByRole('link', { name: 'Discover Adventure', exact: true }).click();
  await expect(page).toHaveURL(/\/discover\?/);
  expect(new URL(page.url()).searchParams.get('watch_region')).toBe('US');
  expect(new URL(page.url()).searchParams.get('genreId')).toBe('12');
  expect(new URL(page.url()).searchParams.get('mediaType')).toBe('movie');
});
