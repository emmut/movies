import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { anonymous } from 'better-auth/plugins';

import * as schema from '@/db/schema/auth';
import { env } from '@/env';
import { db } from '@/lib/db';

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  trustedOrigins: [
    env.BETTER_AUTH_TRUSTED_ORIGIN,
    env.VERCEL_BRANCH_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter((domain) => domain != null),
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  session: {
    // Serve the session from a short-lived signed cookie so every request
    // doesn't pay a session+user SELECT before rendering. Sign-out and
    // account linking refresh the cookie, so staleness is bounded to maxAge.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  rateLimit: {
    // Mirrors better-auth's default (on in production only), with an env
    // escape hatch for e2e runs where every sign-in comes from one IP.
    enabled: process.env.NODE_ENV === 'production' && !env.AUTH_RATE_LIMIT_DISABLED,
  },
  socialProviders: {
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },

  plugins: [
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        try {
          // Lazy import: system-list.ts is server-only and would break
          // better-auth CLI commands (e.g. `auth generate`) that load this
          // config in plain Node.
          const { transferSystemListItems } = await import('@/lib/system-list');
          await transferSystemListItems(anonymousUser.user.id, newUser.user.id);
        } catch (error) {
          console.error('Failed to link your account:', error);
        }
      },
    }),
    passkey(),
    nextCookies(),
  ],
});
