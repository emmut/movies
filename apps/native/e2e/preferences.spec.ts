import { corsHeaders, mockEmptySupport, preflight, readInput } from '@native/e2e/catalog-fixtures';
import { mockAccountRegion, mockSession } from '@native/e2e/session-fixtures';
import { expect, test, type Page } from '@playwright/test';

async function recordHomeRegions(page: Page) {
  const regions: string[] = [];
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    if (input.region) {
      regions.push(input.region);
    }
    await route.fulfill({ json: { json: [] }, headers: corsHeaders });
  });
  return regions;
}
test.beforeEach(mockEmptySupport);

test('a signed-in homepage uses and saves the account region shared with web', async ({ page }) => {
  await mockSession(page);
  const account = await mockAccountRegion(page, 'NO');
  const regions = await recordHomeRegions(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Region: Norway/ })).toBeVisible();
  await expect.poll(() => regions.filter((region) => region === 'NO').length).toBe(6);

  await page.getByRole('button', { name: /Region: Norway/ }).click();
  await page.getByRole('radio', { name: 'Denmark', exact: true }).click();
  await expect(page.getByRole('button', { name: /Region: Denmark/ })).toBeVisible();
  await expect.poll(() => account.saves).toEqual(['DK']);
  await expect.poll(() => regions.filter((region) => region === 'DK').length).toBe(6);

  await page.reload();
  await expect(page.getByRole('button', { name: /Region: Denmark/ })).toBeVisible();
  await expect(page.getByText('Couldn’t save your region.', { exact: false })).not.toBeAttached();
});

test('a failed account save restores the stored region and explains how to retry', async ({
  page,
}) => {
  await mockSession(page);
  const account = await mockAccountRegion(page, 'NO', { failSaves: true });
  await recordHomeRegions(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Region: Norway/ })).toBeVisible();
  await page.getByRole('button', { name: /Region: Norway/ }).click();
  await page.getByRole('radio', { name: 'Finland', exact: true }).click();
  await expect.poll(() => account.saves).toEqual(['FI']);
  await expect(page.getByRole('button', { name: /Region: Norway/ })).toBeVisible();
  await expect(
    page.getByText('Couldn’t save your region. Choose it again to retry.', { exact: true }),
  ).toBeVisible();
});

test('signed-out region changes stay on the device and never call the account API', async ({
  page,
}) => {
  await mockSession(page, () => false);
  const account = await mockAccountRegion(page, 'NO');
  const regions = await recordHomeRegions(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Region: Sweden/ }).click();
  await page.getByRole('radio', { name: 'Germany', exact: true }).click();
  await expect.poll(() => regions.filter((region) => region === 'DE').length).toBe(6);
  expect(account.saves).toEqual([]);
});

test('a pending account save disables another selection until the write completes', async ({
  page,
}) => {
  await mockSession(page);
  const account = await mockAccountRegion(page, 'NO');
  await recordHomeRegions(page);
  let completeSave = () => {};
  const saveGate = new Promise<void>((resolve) => {
    completeSave = resolve;
  });
  await page.route('**/rpc/preferences/setRegion', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    account.saves.push(input.region);
    await saveGate;
    account.region = input.region;
    await route.fulfill({ json: { json: { region: account.region } }, headers: corsHeaders });
  });
  try {
    await page.goto('/');
    await page.getByRole('button', { name: /Region: Norway/ }).click();
    await page.getByRole('radio', { name: 'Denmark', exact: true }).click();
    await expect.poll(() => account.saves).toEqual(['DK']);
    await expect(page.getByRole('button', { name: /Region: Denmark/ })).toBeDisabled();
    completeSave();
    await expect(page.getByRole('button', { name: /Region: Denmark/ })).toBeEnabled();
    await page.getByRole('button', { name: /Region: Denmark/ }).click();
    await page.getByRole('radio', { name: 'Finland', exact: true }).click();
    await expect.poll(() => account.saves).toEqual(['DK', 'FI']);
    await expect.poll(() => account.region).toBe('FI');
  } finally {
    completeSave();
  }
});

test('failed saves without any account data restore the prior session region', async ({ page }) => {
  await mockSession(page);
  await recordHomeRegions(page);
  await page.route(/\/rpc\/preferences\/(region|setRegion)(?:\?|$)/, async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      status: 500,
      json: {
        json: { defined: false, code: 'INTERNAL_SERVER_ERROR', status: 500, message: 'offline' },
      },
      headers: corsHeaders,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Region: Sweden/ }).click();
  await page.getByRole('radio', { name: 'Finland', exact: true }).click();
  await expect(
    page.getByText('Couldn’t save your region. Choose it again to retry.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Region: Sweden/ })).toBeEnabled();
  await page.getByRole('button', { name: 'More navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('button', { name: /Region: Sweden/ })).toBeEnabled();
});
