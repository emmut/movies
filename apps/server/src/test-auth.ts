import type { SessionUser } from '@movies/api/session';
import { createAuth, type Session } from '@movies/auth';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { drizzle } from 'drizzle-orm/node-postgres';
import { vi } from 'vite-plus/test';

type TestAuthOptions = Pick<BetterAuthOptions, 'advanced' | 'rateLimit' | 'session' | 'account'> & {
  baseURL?: string;
};

/** Exercise the shared configuration with Better Auth's memory adapter, without opening a pool. */
export function createTestAuth(options: TestAuthOptions = {}) {
  const config = createAuth(
    {
      NODE_ENV: 'test',
      BETTER_AUTH_URL: options.baseURL ?? 'http://localhost:3000',
      BETTER_AUTH_SECRET: 'a-fixture-secret-of-at-least-32-characters',
      AUTH_RATE_LIMIT_DISABLED: false,
      DISCORD_CLIENT_ID: 'discord-id',
      DISCORD_CLIENT_SECRET: 'discord-secret',
      GITHUB_CLIENT_ID: 'github-id',
      GITHUB_CLIENT_SECRET: 'github-secret',
    },
    drizzle.mock(),
  );
  return betterAuth({
    ...config.options,
    ...options,
    database: memoryAdapter({ user: [], session: [], account: [], verification: [], passkey: [] }),
  });
}

export function testSession(user: SessionUser | null): Session | null {
  if (!user) {
    return null;
  }
  const createdAt = new Date('2026-01-01');
  return {
    user: { ...user, emailVerified: false, createdAt, updatedAt: createdAt },
    session: {
      id: 'test-session',
      token: 'test-token',
      userId: user.id,
      createdAt,
      updatedAt: createdAt,
      expiresAt: new Date('2099-01-01'),
    },
  };
}

/** Real inferred endpoint types; each test replaces only the behavior it exercises. */
export function mockAuth(user: SessionUser | null = null) {
  const auth = createTestAuth();
  vi.spyOn(auth.api, 'getSession').mockResolvedValue(testSession(user));
  vi.spyOn(auth, 'handler').mockResolvedValue(Response.json({ success: true }));
  return auth;
}
