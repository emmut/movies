import 'server-only';
import { expo } from '@better-auth/expo';
import { passkey } from '@better-auth/passkey';
import { AUTH_CLIENT_IP_HEADER } from '@movies/auth/proxy';
import { nativeTrustedOrigins } from '@movies/config/native-auth';
import * as schema from '@movies/db/schema/auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { anonymous } from 'better-auth/plugins';

import { env } from '@/env';
import { db } from '@/lib/db';
import { passkeyOrigins } from '@/lib/passkey-origins';

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  advanced: { ipAddress: { ipAddressHeaders: [AUTH_CLIENT_IP_HEADER, 'x-real-ip'] } },
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
        // Keep this lazy: auth config is also loaded by the schema CLI outside Next.
        const { createAnonymousAccountTransfer } = await import('@movies/db/account-transfer');
        const transfer = createAnonymousAccountTransfer(db);
        // Throw on failure: Better Auth must retain the source guest instead of deleting its lists.
        await transfer(anonymousUser.user.id, newUser.user.id);
      },
    }),
    passkey({
      rpName: 'Movies',
      origin: passkeyOrigins(
        env.NEXT_PUBLIC_BASE_URL,
        env.PASSKEY_ANDROID_FINGERPRINTS,
        process.env.NODE_ENV === 'development',
      ),
    }),
    nextCookies(),
  ],
});
