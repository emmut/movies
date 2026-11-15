import { corsHeaders, mockEmptySupport, preflight } from '@native/e2e/catalog-fixtures';
import { textContrastRatios } from '@native/e2e/contrast';
import {
  mockAccountRegion,
  mockProviderPreferences,
  sessionResponse,
} from '@native/e2e/session-fixtures';
import { expect, test, type Page } from '@playwright/test';

async function model(page: Page, anonymous = false) {
  await mockEmptySupport({ page });
  await mockAccountRegion(page, 'SE');
  await mockProviderPreferences(page, []);
  const data = {
    anonymous,
    failRead: false,
    failDelete: false,
    readCalls: 0,
    deletes: [] as string[],
    renames: [] as { id: string; name: string }[],
    keys: [
      {
        id: 'key-1',
        name: 'My phone',
        deviceType: 'multiDevice',
        createdAt: '2026-01-02T12:00:00.000Z',
      },
    ],
    social: [] as Record<string, unknown>[],
  };
  await page.route('**/api/auth/get-session*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const response = sessionResponse();
    response.user.isAnonymous = data.anonymous;
    response.user.id = data.anonymous ? 'guest' : 'account';
    response.session.userId = response.user.id;
    await route.fulfill({ json: response, headers: corsHeaders });
  });
  await page.route('**/api/auth/passkey/list-user-passkeys*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    data.readCalls += 1;
    await route.fulfill(
      data.failRead
        ? {
            status: 500,
            json: { code: 'INTERNAL_SERVER_ERROR', message: 'unavailable' },
            headers: corsHeaders,
          }
        : { json: data.keys, headers: corsHeaders },
    );
  });
  await page.route('**/api/auth/passkey/delete-passkey*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = route.request().postDataJSON();
    data.deletes.push(input.id);
    if (data.failDelete) {
      await route.fulfill({
        status: 500,
        json: { code: 'INTERNAL_SERVER_ERROR', message: 'unavailable' },
        headers: corsHeaders,
      });
      return;
    }
    data.keys = data.keys.filter((key) => key.id !== input.id);
    await route.fulfill({ json: { status: true }, headers: corsHeaders });
  });
  await page.route('**/api/auth/passkey/update-passkey*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = route.request().postDataJSON();
    data.renames.push(input);
    data.keys = data.keys.map((key) => (key.id === input.id ? { ...key, name: input.name } : key));
    await route.fulfill({ json: { passkey: data.keys[0] }, headers: corsHeaders });
  });
  return data;
}
test('guest linking preserves the settings destination and only finishes with a verified registered session', async ({
  page,
}) => {
  const data = await model(page, true);
  await page.route('**/api/auth/sign-in/social', async (route) => {
    if (await preflight(route)) {
      return;
    }
    data.social.push(route.request().postDataJSON());
    data.anonymous = false;
    await route.fulfill({
      json: { url: 'https://github.com/login/oauth', redirect: false },
      headers: corsHeaders,
    });
  });
  await page.goto('/more/settings');
  await expect(page.getByRole('heading', { name: 'Link your account', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Link using GitHub', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Passkeys', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Link your account', exact: true }),
  ).not.toBeAttached();
  expect(data.social[0]).toMatchObject({
    provider: 'github',
    callbackURL: 'http://localhost:8083/more/settings',
    errorCallbackURL: 'http://localhost:8083/more/settings?error=failed_to_link_account',
  });
});
test('cancelled linking cannot finish using the existing guest session', async ({ page }) => {
  await model(page, true);
  await page.route('**/api/auth/sign-in/social', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { redirect: false }, headers: corsHeaders });
  });
  await page.goto('/more/settings');
  await page.getByRole('button', { name: 'Link using Discord', exact: true }).click();
  await expect(
    page.getByText('Account linking was cancelled or did not finish. Please try again.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Link using GitHub', exact: true })).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Passkeys', exact: true })).not.toBeAttached();
});
test('linking errors survive callback return and pending requests block duplicate provider choices', async ({
  page,
}) => {
  await model(page, true);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/auth/sign-in/social', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await gate;
    await route.fulfill({
      status: 400,
      json: { code: 'OAUTH_ERROR', message: 'declined' },
      headers: corsHeaders,
    });
  });
  await page.goto('/more/settings?error=failed_to_link_account');
  await expect(page.getByText('Couldn’t link your account. Please try again.')).toBeVisible();
  await page.getByRole('button', { name: 'Link using GitHub', exact: true }).click();
  try {
    await expect(
      page.getByRole('button', { name: 'Link using Discord', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Link using GitHub', exact: true }),
    ).toBeDisabled();
  } finally {
    release();
  }
  await expect(page.getByRole('button', { name: 'Link using GitHub', exact: true })).toBeEnabled();
  await expect(page.getByText('Couldn’t link your account. Please try again.')).toBeVisible();
});
test('passkey metadata supports confirmed deletion and preserves other settings', async ({
  page,
}) => {
  const data = await model(page);
  await page.goto('/more/settings');
  await expect(page.getByText('My phone', { exact: true })).toBeVisible();
  await expect(page.getByText('Synced · Created: 2 Jan 2026', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete passkey My phone', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel Delete Passkey', exact: true }).click();
  expect(data.deletes).toEqual([]);
  await page.getByRole('button', { name: 'Delete passkey My phone', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm Delete Passkey', exact: true }).click();
  await expect(
    page.getByText('No passkeys found. Add your first passkey to get started.'),
  ).toBeVisible();
  expect(data.deletes).toEqual(['key-1']);
  await expect(page.getByRole('button', { name: 'Region: Sweden', exact: true })).toBeVisible();
});
test('passkey read/delete failures have independent retry and never look like an empty list', async ({
  page,
}) => {
  const data = await model(page);
  data.failRead = true;
  await page.goto('/more/settings');
  await expect(page.getByText('Couldn’t load your passkeys.')).toBeVisible();
  await expect(
    page.getByText('No passkeys found. Add your first passkey to get started.'),
  ).not.toBeAttached();
  data.failRead = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.getByRole('button', { name: 'Delete passkey My phone', exact: true }).click();
  data.failDelete = true;
  await page.getByRole('button', { name: 'Confirm Delete Passkey', exact: true }).click();
  await expect(page.getByText('Couldn’t delete your passkey. Please try again.')).toBeVisible();
  expect(data.keys).toHaveLength(1);
  data.failDelete = false;
  await page.getByRole('button', { name: 'Confirm Delete Passkey', exact: true }).click();
  await expect(
    page.getByText('No passkeys found. Add your first passkey to get started.'),
  ).toBeVisible();
});
test('unsupported authenticators retain management and explain unavailable creation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'PublicKeyCredential', { value: undefined, configurable: true });
  });
  await model(page);
  await page.goto('/more/settings');
  await expect(page.getByRole('button', { name: 'Add Passkey', exact: true })).toBeDisabled();
  await expect(
    page.getByText('Passkeys can’t be created here. You can still manage existing passkeys.'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Delete passkey My phone', exact: true }),
  ).toBeVisible();
});
test('renaming a passkey validates and saves the trimmed name', async ({ page }) => {
  const data = await model(page);
  await page.goto('/more/settings');
  await page.getByRole('button', { name: 'Rename passkey My phone', exact: true }).click();
  const field = page.getByRole('textbox', { name: 'Passkey Name', exact: true });
  await expect(field).toHaveValue('My phone');
  await field.fill(' ');
  await page.getByRole('button', { name: 'Confirm Rename Passkey', exact: true }).click();
  await expect(page.getByText('Please enter a name for your passkey.')).toBeVisible();
  await field.fill(' Work phone ');
  await page.getByRole('button', { name: 'Confirm Rename Passkey', exact: true }).click();
  await expect(page.getByText('Work phone', { exact: true })).toBeVisible();
  expect(data.renames).toEqual([{ id: 'key-1', name: 'Work phone' }]);
});
async function mockRegistrationPrompt(page: Page, errorName: string) {
  await page.addInitScript((name: string) => {
    Object.defineProperty(navigator.credentials, 'create', {
      value: async () => {
        throw new DOMException('prompt failed', name);
      },
      configurable: true,
    });
  }, errorName);
  await page.route('**/api/auth/passkey/generate-register-options*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: {
        challenge: 'Y2hhbGxlbmdl',
        rp: { id: 'localhost', name: 'Movies' },
        user: { id: 'dXNlcg', name: 'Account', displayName: 'Account' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      },
      headers: corsHeaders,
    });
  });
}

test('adding a passkey validates the draft and treats device cancellation as recoverable', async ({
  page,
}) => {
  await model(page);
  await mockRegistrationPrompt(page, 'NotAllowedError');
  await page.goto('/more/settings');
  await page.getByRole('button', { name: 'Add Passkey', exact: true }).click();
  await page.getByRole('textbox', { name: 'Passkey Name', exact: true }).fill(' ');
  await page.getByRole('button', { name: 'Confirm Add Passkey', exact: true }).click();
  await expect(page.getByText('Please enter a name for your passkey.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Passkey Name', exact: true }).fill('My laptop');
  await page.getByRole('button', { name: 'Confirm Add Passkey', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Passkey Name', exact: true })).toHaveValue(
    'My laptop',
  );
  // A prompt the user dismissed needs no message; the sheet stays open to retry.
  await expect(page.getByRole('alert')).not.toBeAttached();
  await expect(
    page.getByRole('button', { name: 'Confirm Add Passkey', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Cancel Add Passkey' }).click();
});
test('passkey security failures remain visible and can be retried', async ({ page }) => {
  await model(page);
  await mockRegistrationPrompt(page, 'SecurityError');
  await page.goto('/more/settings');
  await page.getByRole('button', { name: 'Add Passkey', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm Add Passkey', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Failed to add passkey. Please try again.');
  await expect(
    page.getByRole('button', { name: 'Confirm Add Passkey', exact: true }),
  ).toBeEnabled();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`security cards match the settings hierarchy in ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await model(page);
    await page.goto('/more/settings');
    const add = page.getByRole('button', { name: 'Add Passkey', exact: true });
    await expect(add).toBeVisible();
    for (const ratio of await textContrastRatios(add)) {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
    await page.screenshot({ path: `/tmp/pr350-native-passkeys-${colorScheme}.png` });
    await add.click();
    await page.screenshot({ path: `/tmp/pr350-native-add-passkey-${colorScheme}.png` });
  });
}

test('passkeys refresh through the query when settings regains focus', async ({ page }) => {
  const data = await model(page);
  await page.goto('/more/settings');
  await expect(page.getByText('My phone', { exact: true })).toBeVisible();
  const reads = data.readCalls;
  await page
    .getByTestId('bottom-navigation')
    .getByRole('button', { name: 'Search', exact: true })
    .click();
  await expect(page).toHaveURL(/\/search$/);
  data.keys = [{ ...data.keys[0], id: 'key-2', name: 'Added on another device' }];
  await page.goBack();
  await expect(page).toHaveURL(/\/more\/settings$/);
  await expect(page.getByText('Added on another device', { exact: true })).toBeVisible();
  await expect(page.getByText('My phone', { exact: true })).not.toBeAttached();
  expect(data.readCalls).toBeGreaterThan(reads);
});
