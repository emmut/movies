import { expect, test } from '@playwright/test';

import { signInAnonymously } from './helpers';

// Opt in against the local Hono host: never mutate a remote account or silently mock freshness.
const apiUrl = process.env.PREFERENCE_TEST_API_URL;
test.skip(!apiUrl, 'Set PREFERENCE_TEST_API_URL to the local API using the web test database');

test('web Settings refreshes the shared account after Hono region/provider mutations', async ({
  page,
  baseURL,
}) => {
  if (!apiUrl || !['localhost', '127.0.0.1'].includes(new URL(apiUrl).hostname)) {
    throw new Error('Preference freshness integration requires a local API');
  }
  if (!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) {
    throw new Error('Preference integration requires a local web app');
  }
  await signInAnonymously(page, '/settings');
  try {
    const cookies = await page.context().cookies();
    const cookie = cookies.map((item) => item.name + '=' + item.value).join('; ');
    await expect(page.getByRole('combobox', { name: 'Region', exact: true })).toContainText(
      'Sweden',
    );
    const netflix = page.getByRole('button', { name: /Netflix Netflix/, exact: true });
    await expect(netflix).toBeVisible();
    await expect(netflix).toHaveClass(/border-border/);
    const providerSave = await page.request.post(apiUrl + '/rpc/preferences/setProviders', {
      headers: { cookie },
      data: { json: { providerIds: [8] } },
    });
    expect(providerSave.status()).toBe(200);
    const regionSave = await page.request.post(apiUrl + '/rpc/preferences/setRegion', {
      headers: { cookie },
      data: { json: { region: 'NO' } },
    });
    expect(regionSave.status()).toBe(200);
    // A browser returning from native/system UI must re-read private render props, not just React Query.
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByRole('combobox', { name: 'Region', exact: true })).toContainText(
      'Norway',
    );
    await expect(netflix).toHaveClass(/border-primary/);
    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Region', exact: true })).toContainText(
      'Norway',
    );
    await expect(netflix).toHaveClass(/border-primary/);
  } finally {
    const deletion = await page.request.post('/api/auth/delete-anonymous-user', {
      headers: { origin: new URL(page.url()).origin },
      data: {},
    });
    expect(deletion.status()).toBe(200);
  }
});

const nativeUrl = process.env.PREFERENCE_TEST_NATIVE_URL;
test('native Settings saves real providers and web reflects the same account', async ({
  page,
  context,
  baseURL,
}) => {
  test.skip(!nativeUrl, 'Set PREFERENCE_TEST_NATIVE_URL to the exported local native browser app');
  if (!nativeUrl || !apiUrl || !['localhost', '127.0.0.1'].includes(new URL(nativeUrl).hostname)) {
    throw new Error('Native preference integration requires a local browser export and API');
  }
  if (!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) {
    throw new Error('Preference integration requires a local web app');
  }
  await signInAnonymously(page, '/settings');
  const native = await context.newPage();
  try {
    await native.emulateMedia({ colorScheme: 'dark' });
    await native.goto(nativeUrl + '/more/settings');
    const netflix = native.getByRole('checkbox', { name: 'Netflix', exact: true });
    await expect(netflix).toBeVisible();
    await netflix.click();
    await native.getByRole('button', { name: 'Save Preferences', exact: true }).click();
    await expect(native.getByText('Preferences saved!', { exact: true })).toBeVisible();
    await netflix.scrollIntoViewIfNeeded();
    await native.screenshot({ path: '/tmp/native-provider-live-native.png' });
    await page.bringToFront();
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    const webNetflix = page.getByRole('button', { name: /Netflix Netflix/, exact: true });
    await expect(webNetflix).toHaveClass(/border-primary/);
    await webNetflix.scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/native-provider-live-web.png' });
    await native.reload();
    await expect(netflix).toBeChecked();
  } finally {
    await native.close();
    const deletion = await page.request.post('/api/auth/delete-anonymous-user', {
      headers: { origin: new URL(page.url()).origin },
      data: {},
    });
    expect(deletion.status()).toBe(200);
  }
});
