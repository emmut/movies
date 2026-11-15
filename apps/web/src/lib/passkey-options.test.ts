import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { anonymous } from 'better-auth/plugins';
import { describe, expect, it } from 'vite-plus/test';

import { APP_NAME, passkeyOptions } from './passkey-options';

// A real Better Auth instance on an in-memory store, so the assertions cover
// the WebAuthn options the plugin actually hands to the browser.
function createTestAuth() {
  return betterAuth({
    appName: APP_NAME,
    baseURL: 'https://movies.example.com',
    secret: 'test-secret-that-is-long-enough-for-better-auth',
    database: memoryAdapter({ user: [], session: [], account: [], verification: [], passkey: [] }),
    plugins: [anonymous(), passkey(passkeyOptions)],
  });
}

async function signedInHeaders(auth: ReturnType<typeof createTestAuth>) {
  const { headers } = await auth.api.signInAnonymous({ returnHeaders: true });
  const cookie = headers.getSetCookie().map((entry) => entry.split(';')[0]);
  return new Headers({ cookie: cookie.join('; ') });
}

describe('passkey options', () => {
  it('requires discoverable, user-verified credentials at registration', async () => {
    const auth = createTestAuth();
    const headers = await signedInHeaders(auth);

    const options = await auth.api.generatePasskeyRegistrationOptions({ headers });

    expect(options.rp).toEqual({ name: APP_NAME, id: 'movies.example.com' });
    expect(options.authenticatorSelection).toMatchObject({
      residentKey: 'required',
      requireResidentKey: true,
      userVerification: 'required',
    });
  });

  it('requires user verification at sign-in', async () => {
    const auth = createTestAuth();

    const options = await auth.api.generatePasskeyAuthenticationOptions();

    expect(options.rpId).toBe('movies.example.com');
    expect(options.userVerification).toBe('required');
    expect(options.allowCredentials).toBeUndefined();
  });
});
