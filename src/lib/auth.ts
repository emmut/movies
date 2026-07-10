import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { anonymous } from 'better-auth/plugins';
import { and, eq } from 'drizzle-orm';

import * as schema from '@/db/schema/auth';
import { listItems, lists } from '@/db/schema/lists';
import { env } from '@/env';
import { db } from '@/lib/db';
import { getOrCreateWatchlistListId, WATCHLIST_LIST_TYPE } from '@/lib/watchlist-list';

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
          const anonymousUserWatchlist = await db
            .select({
              resourceId: listItems.resourceId,
              resourceType: listItems.resourceType,
            })
            .from(listItems)
            .innerJoin(lists, eq(listItems.listId, lists.id))
            .where(
              and(
                eq(lists.userId, anonymousUser.user.id),
                eq(lists.type, WATCHLIST_LIST_TYPE),
              ),
            );

          if (anonymousUserWatchlist.length === 0) {
            return;
          }

          // Transfer watchlist items from anonymous user to linked account
          // Duplicates are handled by unique constraint on (listId, resourceId, resourceType)
          const targetListId = await getOrCreateWatchlistListId(newUser.user.id);
          await db
            .insert(listItems)
            .values(
              anonymousUserWatchlist.map(({ resourceId, resourceType }) => ({
                id: crypto.randomUUID(),
                resourceId,
                resourceType,
                listId: targetListId,
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
