import { expo } from '@better-auth/expo';
import { passkey } from '@better-auth/passkey';
import { nativeTrustedOrigins } from '@movies/config/native-auth';
import * as schema from '@movies/db/schema/auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { anonymous } from 'better-auth/plugins';

import { env } from '@/env';
import { db } from '@/lib/db';

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  trustedOrigins: async (request) =>
    [
      env.BETTER_AUTH_TRUSTED_ORIGIN,
      env.VERCEL_BRANCH_URL,
      env.VERCEL_PROJECT_PRODUCTION_URL,
      ...nativeTrustedOrigins(
        process.env.NODE_ENV === 'development',
        request?.headers.get('origin'),
      ),
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
    expiresIn: 60 * 60 * 24 * 365, // 1 year
    updateAge: 60 * 60 * 24 * 30, // 30 days - refresh session monthly
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
    expo(),
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        try {
          // Lazy import: system-list.ts is server-only and would break
          // better-auth CLI commands (e.g. `auth generate`) that load this
          // config in plain Node.
          const { createSystemListStore } = await import('@movies/db/system-lists');
          const { transferSystemListItems } = createSystemListStore(db);
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
