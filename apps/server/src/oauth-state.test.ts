import { createTestAuth } from '@server/test-auth';
import { afterEach, expect, it, vi } from 'vite-plus/test';

const authOrigin = 'https://movies.example.com';
const apiOrigin = 'https://api.example.com';

afterEach(() => vi.restoreAllMocks());

it.each([authOrigin, apiOrigin])(
  'keeps OAuth state cookies scoped to the browser entry host %s',
  async (browserOrigin) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const auth = createTestAuth({
      baseURL: authOrigin,
      account: { storeStateStrategy: 'database' },
    });
    const signIn = await auth.handler(
      new Request(apiOrigin + '/api/auth/sign-in/social', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'expo-origin': 'movies://' },
        body: JSON.stringify({
          provider: 'github',
          callbackURL: 'movies://discover',
          errorCallbackURL: 'movies://login',
        }),
      }),
    );
    expect(signIn.status).toBe(200);
    const { url } = await signIn.json();
    const authorization = new URL(url);
    const callback = new URL(authorization.searchParams.get('redirect_uri')!);
    expect(callback.origin).toBe(authOrigin);

    const proxy = new URL('/api/auth/expo-authorization-proxy', browserOrigin);
    proxy.searchParams.set('authorizationURL', authorization.href);
    const browser = await auth.handler(new Request(proxy));
    expect(browser.status).toBe(302);
    const cookies = browser.headers.getSetCookie();
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).not.toMatch(/;\s*domain=/i);
    const cookie = cookies.map((value) => value.split(';')[0]).join('; ');

    // Host-only cookies are sent back only to the browser entry host. Simulate a
    // provider denial so the test verifies state without contacting a provider.
    callback.searchParams.set('state', authorization.searchParams.get('state')!);
    callback.searchParams.set('error', 'access_denied');
    const result = await auth.handler(
      new Request(callback, {
        headers: callback.origin === browserOrigin ? { cookie } : {},
      }),
    );
    const location = new URL(result.headers.get('location')!);
    expect(location.searchParams.get('error')).toBe(
      browserOrigin === authOrigin ? 'access_denied' : 'state_mismatch',
    );
  },
);
