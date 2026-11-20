import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { beforeEach, expect, it, vi } from 'vite-plus/test';

const fixtures = vi.hoisted(() => ({
  auth: { configured: true },
  database: undefined as NodePgDatabase | undefined,
  config: {
    BETTER_AUTH_URL: 'http://localhost:3000' as string | undefined,
    BETTER_AUTH_SECRET: 'a-fixture-secret-of-at-least-32-characters' as string | undefined,
    DISCORD_CLIENT_ID: 'discord-id',
    DISCORD_CLIENT_SECRET: 'discord-secret',
    GITHUB_CLIENT_ID: 'github-id',
    GITHUB_CLIENT_SECRET: 'github-secret',
    NODE_ENV: 'test',
    AUTH_RATE_LIMIT_DISABLED: false,
    BETTER_AUTH_TRUSTED_ORIGIN: undefined,
    PASSKEY_ANDROID_FINGERPRINTS: undefined,
  },
  createAuth: vi.fn(),
}));
vi.mock('@movies/auth', () => ({ createAuth: fixtures.createAuth }));
vi.mock('@server/env', () => ({ ENV: fixtures.config }));
vi.mock('@server/database', () => ({
  get database() {
    return fixtures.database;
  },
}));

beforeEach(() => {
  vi.resetModules();
  fixtures.createAuth.mockReset().mockReturnValue(fixtures.auth);
  fixtures.database = drizzle.mock();
  fixtures.config.BETTER_AUTH_URL = 'http://localhost:3000';
  fixtures.config.BETTER_AUTH_SECRET = 'a-fixture-secret-of-at-least-32-characters';
});

it('creates the shared auth instance with explicit configuration and the product database', async () => {
  const { auth } = await import('@server/auth');
  expect(auth).toBe(fixtures.auth);
  expect(fixtures.createAuth).toHaveBeenCalledExactlyOnceWith(fixtures.config, fixtures.database);
});

it('keeps local catalog-only mode available without instantiating Better Auth', async () => {
  fixtures.config.BETTER_AUTH_URL = undefined;
  expect((await import('@server/auth')).auth).toBeUndefined();
  expect(fixtures.createAuth).not.toHaveBeenCalled();
});

it.each(['database', 'secret'])(
  'fails startup for incomplete enabled auth: %s',
  async (missing) => {
    if (missing === 'database') {
      fixtures.database = undefined;
    } else {
      fixtures.config.BETTER_AUTH_SECRET = undefined;
    }
    await expect(import('@server/auth')).rejects.toThrow('Authentication requires');
    expect(fixtures.createAuth).not.toHaveBeenCalled();
  },
);
