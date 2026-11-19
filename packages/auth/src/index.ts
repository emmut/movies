import 'server-only';
import { expo } from '@better-auth/expo';
import { passkey } from '@better-auth/passkey';
import { AUTH_CLIENT_IP_HEADER } from '@movies/auth/proxy';
import { nativeTrustedOrigins } from '@movies/config/native-auth';
import * as schema from '@movies/db/schema/auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { anonymous } from 'better-auth/plugins';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { APP_NAME, passkeyOptions } from './passkey-options';
import { passkeyOrigins } from './passkey-origins';

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_TRUSTED_ORIGIN?: string;
  NODE_ENV: string;
  AUTH_RATE_LIMIT_DISABLED: boolean;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  PASSKEY_ANDROID_FINGERPRINTS?: string;
};

/** Hono owns one Better Auth instance; clients use its official SDKs. */
export function createAuth(config: AuthConfig, db: NodePgDatabase) {
  const isDevelopment = config.NODE_ENV === 'development';
  return betterAuth({
    appName: APP_NAME,
    baseURL: config.BETTER_AUTH_URL,
    secret: config.BETTER_AUTH_SECRET,
    advanced: { ipAddress: { ipAddressHeaders: [AUTH_CLIENT_IP_HEADER] } },
    trustedOrigins: async (request) =>
      [
        config.BETTER_AUTH_URL,
        config.BETTER_AUTH_TRUSTED_ORIGIN,
        ...nativeTrustedOrigins(isDevelopment, request?.headers.get('origin')),
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
      enabled: config.NODE_ENV === 'production' && !config.AUTH_RATE_LIMIT_DISABLED,
    },
    socialProviders: {
      discord: {
        clientId: config.DISCORD_CLIENT_ID,
        clientSecret: config.DISCORD_CLIENT_SECRET,
      },
      github: {
        clientId: config.GITHUB_CLIENT_ID,
        clientSecret: config.GITHUB_CLIENT_SECRET,
      },
    },

    plugins: [
      expo(),
      anonymous({
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          // Load account transfer only when an anonymous account is linked.
          const { createAnonymousAccountTransfer } = await import('@movies/db/account-transfer');
          const transfer = createAnonymousAccountTransfer(db);
          // Throw on failure: Better Auth must retain the source guest instead of deleting its lists.
          await transfer(anonymousUser.user.id, newUser.user.id);
        },
      }),
      passkey({
        ...passkeyOptions,
        origin: passkeyOrigins(
          config.BETTER_AUTH_URL,
          config.PASSKEY_ANDROID_FINGERPRINTS,
          isDevelopment,
        ),
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];
