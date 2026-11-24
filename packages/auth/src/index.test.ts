import { memoryAdapter } from 'better-auth/adapters/memory';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createAuth, type AuthConfig } from './index';

const fixtures = vi.hoisted(() => ({
  database: { user: [], session: [], account: [], verification: [], passkey: [] },
}));
vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: () => memoryAdapter(fixtures.database),
}));
const config: AuthConfig = {
  NODE_ENV: 'test',
  BETTER_AUTH_URL: 'https://movies.example.com',
  BETTER_AUTH_SECRET: 'existing-session-signing-secret-at-least-32-characters',
  AUTH_RATE_LIMIT_DISABLED: false,
  DISCORD_CLIENT_ID: 'discord-id',
  DISCORD_CLIENT_SECRET: 'discord-secret',
  GITHUB_CLIENT_ID: 'github-id',
  GITHUB_CLIENT_SECRET: 'github-secret',
};
const db = {} as NodePgDatabase;
beforeEach(() => {
  for (const rows of Object.values(fixtures.database)) {
    rows.length = 0;
  }
});

async function signIn(auth: ReturnType<typeof createAuth>) {
  const result = await auth.api.signInAnonymous({ returnHeaders: true });
  return new Headers({
    cookie: result.headers
      .getSetCookie()
      .map((entry) => entry.split(';')[0])
      .join('; '),
  });
}

describe('shared Better Auth factory', () => {
  it('preserves issued sessions across auth host instances with the same database and secret', async () => {
    const headers = await signIn(createAuth(config, db));
    const auth = createAuth(config, db);
    const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
    expect(session?.user.isAnonymous).toBe(true);
    expect(session?.session.token).toBeTruthy();
    expect(auth.options.baseURL).toBe(config.BETTER_AUTH_URL);
    expect(auth.options.secret).toBe(config.BETTER_AUTH_SECRET);
    expect(auth.options.plugins?.map((plugin) => plugin.id)).toEqual([
      'expo',
      'anonymous',
      'passkey',
    ]);
  });

  it('keeps passkey RP identity and discoverable/user-verification requirements', async () => {
    const auth = createAuth(config, db);
    const headers = await signIn(auth);
    const registration = await auth.api.generatePasskeyRegistrationOptions({ headers });
    expect(registration.rp).toEqual({ id: 'movies.example.com', name: 'Movies' });
    expect(registration.authenticatorSelection).toMatchObject({
      residentKey: 'required',
      userVerification: 'required',
    });
    const authentication = await auth.api.generatePasskeyAuthenticationOptions();
    expect(authentication.rpId).toBe('movies.example.com');
    expect(authentication.allowCredentials).toBeUndefined();
    expect(authentication.userVerification).toBe('required');
  });

  it('enables rate limits in production unless explicitly disabled for tests', () => {
    expect(createAuth({ ...config, NODE_ENV: 'production' }, db).options.rateLimit?.enabled).toBe(
      true,
    );
    expect(
      createAuth({ ...config, NODE_ENV: 'production', AUTH_RATE_LIMIT_DISABLED: true }, db).options
        .rateLimit?.enabled,
    ).toBe(false);
  });

  it('trusts native app schemes and configured web origins, without trusting arbitrary previews', async () => {
    const auth = createAuth(
      { ...config, BETTER_AUTH_TRUSTED_ORIGIN: 'https://preview.example.com' },
      db,
    );
    const context = await auth.$context;
    expect(context.trustedOrigins).toContain('https://movies.example.com');
    expect(context.trustedOrigins).toContain('https://preview.example.com');
    expect(context.trustedOrigins).toContain('movies://');
    expect(context.trustedOrigins).not.toContain('http://localhost:8081');
  });
});
