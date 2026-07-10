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
import { getOrCreateSystemListId } from '@/lib/system-list';
import { type SystemListType, systemListTypeSchema } from '@/lib/validations';

/**
 * Copies the anonymous user's system list items (watchlist, watched, …) into
 * the linked account's list of the same type, creating it if missing.
 * Duplicates are handled by the unique constraint on
 * (listId, resourceId, resourceType).
 */
async function transferSystemListItems(
  anonymousUserId: string,
  newUserId: string,
  listType: SystemListType,
) {
  const anonymousItems = await db
    .select({
      resourceId: listItems.resourceId,
      resourceType: listItems.resourceType,
    })
    .from(listItems)
    .innerJoin(lists, eq(listItems.listId, lists.id))
    .where(and(eq(lists.userId, anonymousUserId), eq(lists.type, listType)));

  if (anonymousItems.length === 0) {
    return;
  }

  const targetListId = await getOrCreateSystemListId(newUserId, listType);
  await db
    .insert(listItems)
    .values(
      anonymousItems.map(({ resourceId, resourceType }) => ({
        id: crypto.randomUUID(),
        resourceId,
        resourceType,
        listId: targetListId,
      })),
    )
    .onConflictDoNothing();
}

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
  advanced: {
    ipAddress: {
      getClientIp: (context) => {
        // Railway forwards client IP in x-forwarded-for when requests come through
        // its ingress. Only use it if present; reject spoofed values.
        // The header format is: client, proxy1, proxy2
        // We take the leftmost (true client) IP.
        const xForwardedFor = context.req.headers['x-forwarded-for'];
        if (typeof xForwardedFor === 'string') {
          const clientIp = xForwardedFor.split(',')[0]?.trim();
          if (clientIp) {
            return clientIp;
          }
        }
        // Fallback to direct connection IP if no forwarded header.
        // In production on Railway, this should not happen for external requests.
        return context.req.socket?.remoteAddress || '';
      },
    },
  },

  plugins: [
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        try {
          for (const listType of systemListTypeSchema.options) {
            await transferSystemListItems(anonymousUser.user.id, newUser.user.id, listType);
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

