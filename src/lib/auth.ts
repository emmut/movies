import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { anonymous } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';

import * as schema from '@/db/schema/auth';
import { userCollections } from '@/db/schema/user-collections';
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
          // Transfer collection items (watchlist, watched) from the anonymous
          // user to the linked account. Duplicates are handled by the unique
          // constraint on (userId, collection, resourceType, resourceId).
          const anonymousRows = await db
            .select()
            .from(userCollections)
            .where(eq(userCollections.userId, anonymousUser.user.id));

          if (anonymousRows.length === 0) {
            return;
          }

          await db
            .insert(userCollections)
            .values(
              anonymousRows.map(({ collection, resourceId, resourceType }) => ({
                id: crypto.randomUUID(),
                collection,
                resourceId,
                resourceType,
                userId: newUser.user.id,
              })),
            )
            .onConflictDoNothing();
        } catch (error) {
          console.error('Failed to link your account:', error);
        }
      },
    }),
    passkey(),
    nextCookies(),
  ],
});
