import { corsHeaders, mockEmptySupport, preflight } from '@native/e2e/catalog-fixtures';
import { expect, test, type Page } from '@playwright/test';

const user = {
  id: 'anonymous-1',
  name: 'Anonymous',
  email: 'anonymous@example.com',
  emailVerified: false,
  image: null,
  isAnonymous: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};
function sessionResponse() {
  return {
    user,
    session: {
      id: 'session-1',
      token: 'test-token',
      userId: user.id,
      expiresAt: '2099-01-01T00:00:00.000Z',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  };
}
async function emptyHome(page: Page) {
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: [] }, headers: corsHeaders });
  });
}
test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await emptyHome(page);
});

test('More opens the native login with recognizable content and all web sign-in methods', async ({
  page,
}) => {
  await page.goto('/more');
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome Back', exact: true })).toBeVisible();
  for (const label of [
    'Continue with Discord',
    'Continue with GitHub',
    'Authenticate with Passkey',
    'Continue as anonymous',
  ]) {
    await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByText('Save favorites and create watchlists')).toBeVisible();
  expect(page.context().pages()).toHaveLength(1);
});

test('anonymous sign-in updates native session navigation and sign-out revokes it', async ({
  page,
}) => {
  let signedIn = false;
  let signOutCalls = 0;
  await page.route('**/api/auth/get-session*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: signedIn ? sessionResponse() : null, headers: corsHeaders });
  });
  await page.route('**/api/auth/sign-in/anonymous', async (route) => {
    if (await preflight(route)) {
      return;
    }
    signedIn = true;
    await route.fulfill({ json: sessionResponse(), headers: corsHeaders });
  });
  await page.route('**/api/auth/sign-out', async (route) => {
    if (await preflight(route)) {
      return;
    }
    signedIn = false;
    signOutCalls += 1;
    await route.fulfill({ json: { success: true }, headers: corsHeaders });
  });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue as anonymous', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:8083/');
  await page.getByRole('button', { name: /Region: Sweden/ }).click();
  await page.getByRole('radio', { name: 'United States', exact: true }).click();
  await expect(page.getByRole('button', { name: /Region: United States/ })).toBeVisible();
  await page.getByRole('button', { name: 'More navigation', exact: true }).click();
  await expect(page.getByText('Signed in as Anonymous')).toBeVisible();
  await expect(page.getByText('Signed in as Anonymous')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).not.toBeAttached();
  expect(signOutCalls).toBe(1);
  await expect(page.getByText('Sign in to save favorites and create watchlists.')).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('button', { name: /Region: Sweden/ })).toBeVisible();
});

test('failed sign-in is retryable and rejects an off-origin return destination', async ({
  page,
}) => {
  let attempts = 0;
  let signedIn = false;
  await page.route('**/api/auth/get-session*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: signedIn ? sessionResponse() : null, headers: corsHeaders });
  });
  await page.route('**/api/auth/sign-in/anonymous', async (route) => {
    if (await preflight(route)) {
      return;
    }
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({
        status: 500,
        json: { code: 'INTERNAL_SERVER_ERROR', message: 'offline' },
        headers: corsHeaders,
      });
      return;
    }
    signedIn = true;
    await route.fulfill({ json: sessionResponse(), headers: corsHeaders });
  });
  await page.goto('/login?redirect_url=https%3A%2F%2Fevil.example');
  await page.getByRole('button', { name: 'Continue as anonymous', exact: true }).click();
  await expect(page.getByText('Couldn’t sign in. Please try again.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue as anonymous', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:8083/');
  expect(attempts).toBe(2);
  expect(page.context().pages()).toHaveLength(1);
});
