import { corsHeaders, preflight, readInput } from '@native/e2e/catalog-fixtures';
import type { Page } from '@playwright/test';

export const sessionUser = {
  id: 'anonymous-1',
  name: 'Anonymous',
  email: 'anonymous@example.com',
  emailVerified: false,
  image: null,
  isAnonymous: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};
export function sessionResponse() {
  return {
    user: sessionUser,
    session: {
      id: 'session-1',
      token: 'test-token',
      userId: sessionUser.id,
      expiresAt: '2099-01-01T00:00:00.000Z',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  };
}
/** Serves `get-session` as signed in while `isSignedIn()` holds. */
export async function mockSession(page: Page, isSignedIn: () => boolean = () => true) {
  await page.route('**/api/auth/get-session*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: isSignedIn() ? sessionResponse() : null, headers: corsHeaders });
  });
}

/** An account region store behind `preferences.*`, recording every save. */
export async function mockAccountRegion(
  page: Page,
  initial: string,
  options: { failSaves?: boolean } = {},
) {
  const account = { region: initial, saves: [] as string[] };
  await page.route('**/rpc/preferences/*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    if (route.request().url().endsWith('/setRegion')) {
      const { region } = readInput(route.request());
      account.saves.push(region);
      if (options.failSaves) {
        await route.fulfill({
          status: 500,
          json: {
            json: {
              defined: false,
              code: 'INTERNAL_SERVER_ERROR',
              status: 500,
              message: 'Internal server error',
            },
          },
          headers: corsHeaders,
        });
        return;
      }
      account.region = region;
    }
    await route.fulfill({ json: { json: { region: account.region } }, headers: corsHeaders });
  });
  return account;
}
