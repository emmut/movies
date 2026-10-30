import { corsHeaders, mockEmptySupport, preflight, readInput } from '@native/e2e/catalog-fixtures';
import {
  mockAccountRegion,
  mockProviderPreferences,
  mockSession,
  sessionResponse,
} from '@native/e2e/session-fixtures';
import { expect, test, type Page } from '@playwright/test';

const choices = [
  { id: 8, name: 'Netflix', logoUrl: null },
  {
    id: 9,
    name: 'A streaming service with a long name',
    logoUrl: 'http://localhost:3001/broken-logo.png',
  },
];

test('saving preferred services refreshes cached system-list options immediately', async ({
  page,
}) => {
  await mockSession(page);
  await mockAccountRegion(page, 'SE');
  const account = await mockProviderPreferences(page, [8], { choices });
  let optionReads = 0;
  await page.route('**/rpc/systemLists/options*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    optionReads += 1;
    await route.fulfill({
      json: { json: choices.filter((choice) => account.providerIds.includes(choice.id)) },
      headers: corsHeaders,
    });
  });
  await page.route('**/rpc/systemLists/page*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: {
        json: {
          items: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          itemsPerPage: 20,
          counts: { movie: 0, tv: 0 },
          unavailableItems: 0,
        },
      },
      headers: corsHeaders,
    });
  });
  await page.goto('/more/watchlist');
  await page.getByRole('button', { name: 'Providers', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Netflix', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close Providers', exact: true }).click();
  const previousReads = optionReads;
  await page.getByRole('button', { name: 'More navigation', exact: true }).click();
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Netflix', exact: true }).click();
  await page.getByRole('checkbox', { name: choices[1].name, exact: true }).click();
  await page.getByRole('button', { name: 'Save Preferences', exact: true }).click();
  await expect(page.getByText('Preferences saved!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'More navigation', exact: true }).click();
  await page.getByRole('link', { name: 'Watchlist', exact: true }).click();
  await page.getByRole('button', { name: 'Providers', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: choices[1].name, exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Netflix', exact: true })).not.toBeAttached();
  expect(optionReads).toBeGreaterThan(previousReads);
});

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/broken-logo.png', (route) => route.fulfill({ status: 404, body: '' }));
});

async function recordDiscovery(page: Page) {
  const inputs: Record<string, unknown>[] = [];
  await page.route('**/rpc/discovery/list*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    inputs.push(readInput(route.request()));
    await route.fulfill({
      json: { json: { items: [], totalPages: 1, totalResults: 0 } },
      headers: corsHeaders,
    });
  });
  await page.route('**/rpc/discovery/options*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: { json: { genres: [], providers: choices, countries: [] } },
      headers: corsHeaders,
    });
  });
  return inputs;
}

test('a late provider save cannot overwrite the next account’s private cache', async ({ page }) => {
  let user: string | null = 'first';
  let secondReads = 0;
  let finishSave = function () {};
  const waiting = new Promise<void>((resolve) => {
    finishSave = resolve;
  });
  function currentSession() {
    if (!user) {
      return null;
    }
    const response = sessionResponse();
    return { user: { ...response.user, id: user }, session: { ...response.session, userId: user } };
  }
  await page.route('**/api/auth/get-session*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: currentSession(), headers: corsHeaders });
  });
  await page.route('**/api/auth/sign-out', async (route) => {
    if (await preflight(route)) {
      return;
    }
    user = null;
    await route.fulfill({ json: { success: true }, headers: corsHeaders });
  });
  await page.route('**/api/auth/sign-in/anonymous', async (route) => {
    if (await preflight(route)) {
      return;
    }
    user = 'second';
    await route.fulfill({ json: currentSession(), headers: corsHeaders });
  });
  await mockAccountRegion(page, 'SE');
  await page.route('**/rpc/preferences/providers*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    if (user === 'second') {
      secondReads += 1;
    }
    await route.fulfill({
      json: { json: { providerIds: user === 'first' ? [8] : [9] } },
      headers: corsHeaders,
    });
  });
  await page.route('**/rpc/preferences/providerOptions*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: choices }, headers: corsHeaders });
  });
  await page.route('**/rpc/preferences/setProviders', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await waiting;
    await route.fulfill({ json: { json: { providerIds: [8, 9] } }, headers: corsHeaders });
  });
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: [] }, headers: corsHeaders });
  });
  await page.goto('/more/settings');
  await page.getByRole('checkbox', { name: choices[1].name, exact: true }).click();
  await page.getByRole('button', { name: 'Save Preferences', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saving...', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Clear All', exact: true })).toBeDisabled();
  await expect(page.getByRole('checkbox', { name: 'Netflix', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'More navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(
    page.getByText('Sign in to save favorites and create watchlists.').filter({ visible: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Continue as anonymous', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:8083/');
  await page.getByRole('button', { name: 'More navigation', exact: true }).click();
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: choices[1].name, exact: true })).toBeChecked();
  const readsBeforeOldResponse = secondReads;
  const oldResponse = page.waitForResponse((response) => response.url().endsWith('/setProviders'));
  finishSave();
  await (await oldResponse).finished();
  // Wait for response handlers and the subsequent render, independent of background requests.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  await expect(page.getByRole('checkbox', { name: 'Netflix', exact: true })).not.toBeChecked();
  expect(secondReads).toBe(readsBeforeOldResponse);
});

test('provider drafts save explicitly, retain unavailable saved IDs, and survive reload', async ({
  page,
}) => {
  await mockSession(page);
  await mockAccountRegion(page, 'NO');
  const account = await mockProviderPreferences(page, [8, 99], { choices });
  await page.goto('/more/settings');
  await expect(page.getByRole('checkbox', { name: 'Netflix', exact: true })).toBeChecked();
  await expect(
    page.getByText('Choose your preferred streaming services to filter content in Discover'),
  ).toBeVisible();
  await page.getByRole('checkbox', { name: choices[1].name, exact: true }).click();
  expect(account.saves).toEqual([]);
  await page.getByRole('button', { name: 'Save Preferences', exact: true }).click();
  await expect(page.getByText('Preferences saved!', { exact: true })).toBeVisible();
  expect(account.saves).toEqual([[8, 99, 9]]);
  expect(account.regions).toContain('NO');
  await page.reload();
  await expect(page.getByRole('checkbox', { name: choices[1].name, exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Clear All', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Netflix', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Save Preferences', exact: true }).click();
  await expect(page.getByText('Preferences saved!', { exact: true })).toBeVisible();
  expect(account.providerIds).toEqual([]);
});

test('failed provider saves retain the draft for retry and never change Discover defaults', async ({
  page,
}) => {
  await mockSession(page);
  await mockAccountRegion(page, 'SE');
  const settings = { choices, failSaves: true };
  const account = await mockProviderPreferences(page, [8], settings);
  const discovery = await recordDiscovery(page);
  await page.goto('/more/settings');
  await page.getByRole('checkbox', { name: choices[1].name, exact: true }).click();
  await page.getByRole('button', { name: 'Save Preferences', exact: true }).click();
  await expect(page.getByText('Failed to save preferences. Please try again.')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: choices[1].name, exact: true })).toBeChecked();
  expect(account.providerIds).toEqual([8]);
  settings.failSaves = false;
  await page.getByRole('button', { name: 'Save Preferences', exact: true }).click();
  await expect(page.getByText('Preferences saved!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Discover', exact: true }).click();
  await expect.poll(() => discovery.at(-1)?.providerIds).toEqual([8, 9]);
});

test('Discover waits for saved defaults, lets explicit URL providers win and restores defaults on clear', async ({
  page,
}) => {
  await mockSession(page);
  await mockAccountRegion(page, 'NO');
  await mockProviderPreferences(page, [8], { choices });
  const inputs = await recordDiscovery(page);
  await page.goto('/discover');
  await expect.poll(() => inputs.at(-1)?.providerIds).toEqual([8]);
  expect(inputs.every((input) => input.region === 'NO')).toBe(true);
  await page.goto('/discover?with_watch_providers=9&page=2');
  await expect.poll(() => inputs.at(-1)?.providerIds).toEqual([9]);
  await page.getByRole('button', { name: 'Clear all filters', exact: true }).click();
  await expect.poll(() => inputs.at(-1)).toMatchObject({ providerIds: [8], page: 1 });
});

test('failed reads have independent retry and cannot overwrite saved preferences with an empty selection', async ({
  page,
}) => {
  await mockSession(page);
  await mockAccountRegion(page, 'SE');
  const settings = { choices, failReads: true };
  await mockProviderPreferences(page, [8], settings);
  await page.goto('/more/settings');
  await expect(page.getByText('Couldn’t load streaming preferences.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Save Preferences', exact: true }),
  ).not.toBeAttached();
  await expect(page.getByRole('button', { name: 'Region: Sweden', exact: true })).toBeVisible();
  settings.failReads = false;
  await page.getByRole('button', { name: 'Retry streaming preferences', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Netflix', exact: true })).toBeChecked();
});

test('empty regional choices preserve saved preferences until Clear All is explicitly saved', async ({
  page,
}) => {
  await mockSession(page);
  await mockAccountRegion(page, 'SE');
  const account = await mockProviderPreferences(page, [99]);
  await page.goto('/more/settings');
  await expect(page.getByText('No streaming services available for your region')).toBeVisible();
  await page.getByRole('button', { name: 'Clear All', exact: true }).click();
  expect(account.providerIds).toEqual([99]);
  await page.getByRole('button', { name: 'Save Preferences', exact: true }).click();
  await expect(page.getByText('Preferences saved!', { exact: true })).toBeVisible();
  expect(account.providerIds).toEqual([]);
});

for (const theme of ['light', 'dark'] as const) {
  test(`streaming provider cards preserve their web treatment in ${theme} appearance`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await mockSession(page);
    await mockAccountRegion(page, 'SE');
    await mockProviderPreferences(page, [8], { choices });
    await page.goto('/more/settings');
    const netflix = page.getByRole('checkbox', { name: 'Netflix', exact: true });
    await expect(netflix).toBeChecked();
    await expect(netflix.getByText('N', { exact: true })).toBeVisible();
    await netflix.scrollIntoViewIfNeeded();
    await expect(
      page
        .getByRole('checkbox', { name: choices[1].name, exact: true })
        .getByText('A', { exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: `/tmp/native-provider-settings-${theme}.png` });
  });
}
