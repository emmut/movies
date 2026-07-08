import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { anonymous } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';

import * as schema from '@/db/schema/auth';
import { watched } from '@/db/schema/watched';
import { watchlist } from '@/db/schema/watchlist';
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
          // Transfer watchlist and watched items from anonymous user to linked account
          // Duplicates are handled by unique constraint on (userId, resourceId, resourceType)
          for (const table of [watchlist, watched]) {
            const anonymousUserRows = await db
              .select()
              .from(table)
              .where(eq(table.userId, anonymousUser.user.id));

            if (anonymousUserRows.length === 0) {
              continue;
            }

            await db
              .insert(table)
              .values(
                anonymousUserRows.map(({ resourceId, resourceType }) => ({
                  id: crypto.randomUUID(),
                  resourceId,
                  resourceType,
                  userId: newUser.user.id,
                })),
              )
              .onConflictDoNothing();
          }
        } catch (error) {
          console.error('Failed to link your account:', error);
        }
      },
    }),
    passkey(),
    nextCookies(),
  ],
});
