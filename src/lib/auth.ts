import * as schema from '@/db/schema/auth';
import { watchlist } from '@/db/schema/watchlist';
import { env } from '@/env';
import { db } from '@/lib/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { anonymous } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';

export const auth = betterAuth({
  trustedOrigins: [env.VERCEL_BRANCH_URL, env.VERCEL_PROJECT_PRODUCTION_URL],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  socialProviders: {
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
  },

  plugins: [
    nextCookies(),
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        try {
          const anonymousUserWatchlist = await db
            .select()
            .from(watchlist)
            .where(eq(watchlist.userId, anonymousUser.user.id));

          if (anonymousUserWatchlist.length === 0) {
            return;
          }

          // Transfer watchlist items from anonymous user to linked account
          // Duplicates are handled by unique constraint on (userId, resourceId, resourceType)
          await db.insert(watchlist).values(
            anonymousUserWatchlist.map(({ resourceId, resourceType }) => ({
              id: crypto.randomUUID(),
              resourceId,
              resourceType,
              userId: newUser.user.id,
            }))
          ).onConflictDoNothing();
        } catch (error) {
          console.error('Failed to link your account:', error);
        }
      },
    }),
  ],
});
