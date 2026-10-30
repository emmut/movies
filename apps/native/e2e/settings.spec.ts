import { corsHeaders, mockEmptySupport, preflight } from '@native/e2e/catalog-fixtures';
import {
  mockAccountRegion,
  mockProviderPreferences,
  mockSession,
} from '@native/e2e/session-fixtures';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await mockProviderPreferences(page);
});

test('More opens native Settings; region drafts save explicitly and survive reload', async ({
  page,
}) => {
  await mockSession(page);
  const account = await mockAccountRegion(page, 'NO');
  await page.goto('/more');
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page).toHaveURL(/\/more\/settings$/);
  await expect(page.getByText('Manage your personal settings')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Region: Norway', exact: true }).click();
  await page.getByRole('radio', { name: 'Denmark', exact: true }).click();
  expect(account.saves).toEqual([]);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByText('Region settings saved!')).toBeVisible();
  expect(account.saves).toEqual(['DK']);
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeDisabled();
  expect(page.context().pages()).toHaveLength(1);
  await page.goBack();
  await expect(page).toHaveURL(/\/more$/);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page).toHaveURL(/\/more\/settings$/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Region: Denmark', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'More navigation', exact: true }).click();
  await expect(page).toHaveURL(/\/more$/);
});

test('failed saves preserve the draft and allow retry without changing the stored account', async ({
  page,
}) => {
  await mockSession(page);
  const account = await mockAccountRegion(page, 'NO', { failSaves: true });
  await page.goto('/more/settings');
  await page.getByRole('button', { name: 'Region: Norway', exact: true }).click();
  await page.getByRole('radio', { name: 'Finland', exact: true }).click();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByText('Could not save region settings. Please try again.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Region: Finland', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect.poll(() => account.saves).toEqual(['FI', 'FI']);
  expect(account.region).toBe('NO');
});

test('signed-out Settings redirects to native sign-in with a safe return destination', async ({
  page,
}) => {
  await mockSession(page, () => false);
  const account = await mockAccountRegion(page, 'NO');
  await page.goto('/more/settings');
  await expect(page).toHaveURL(/\/login\?redirect_url=/);
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  expect(account.saves).toEqual([]);
  expect(page.context().pages()).toHaveLength(1);
});

test('region read failures show recovery and do not render a default form', async ({ page }) => {
  await mockSession(page);
  let failed = true;
  await page.route('**/rpc/preferences/region*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      status: failed ? 500 : 200,
      json: failed
        ? {
            json: {
              defined: false,
              code: 'INTERNAL_SERVER_ERROR',
              status: 500,
              message: 'offline',
            },
          }
        : { json: { region: 'US' } },
      headers: corsHeaders,
    });
  });
  await page.goto('/more/settings');
  await expect(page.getByText('Couldn’t load region settings.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).not.toBeAttached();
  failed = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Region: United States', exact: true }),
  ).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`Settings preserves the web Region card and wording in ${theme} appearance`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await mockSession(page);
    await mockAccountRegion(page, 'SE');
    await page.goto('/more/settings');
    await expect(
      page.getByText('Choose your region to get relevant movies and streaming services'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Region: Sweden', exact: true })).toBeVisible();
    await page.screenshot({ path: `/tmp/native-roadmap-settings-${theme}.png` });
  });
}

test('expired account sessions return to native sign-in rather than showing a default region', async ({
  page,
}) => {
  await mockSession(page);
  await page.route('**/rpc/preferences/region*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      status: 401,
      json: {
        json: { defined: true, code: 'UNAUTHORIZED', status: 401, message: 'Sign in to continue' },
      },
      headers: corsHeaders,
    });
  });
  await page.goto('/more/settings');
  await expect(page).toHaveURL(/\/login\?redirect_url=/);
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
});

test('pending saves prevent duplicate submissions and update Home’s account region', async ({
  page,
}) => {
  await mockSession(page);
  const account = await mockAccountRegion(page, 'SE');
  let finishSave = function () {};
  const waiting = new Promise<void>((resolve) => {
    finishSave = resolve;
  });
  await page.route('**/rpc/preferences/setRegion', async (route) => {
    if (await preflight(route)) {
      return;
    }
    account.saves.push('NO');
    await waiting;
    account.region = 'NO';
    await route.fulfill({ json: { json: { region: 'NO' } }, headers: corsHeaders });
  });
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: [] }, headers: corsHeaders });
  });
  await page.goto('/more/settings');
  await page.getByRole('button', { name: 'Region: Sweden', exact: true }).click();
  await page.getByRole('radio', { name: 'Norway', exact: true }).click();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saving...', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Region: Norway', exact: true })).toBeDisabled();
  expect(account.saves).toEqual(['NO']);
  finishSave();
  await expect(page.getByText('Region settings saved!')).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('button', { name: /Region: Norway/ })).toBeVisible();
});
