import { createDb } from "@movies/db";
import * as schema from "@movies/db/schema/auth";
import { watchlist } from "@movies/db/schema/watchlist";
import { env } from "@movies/env/server";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { eq } from "drizzle-orm";

export function createAuth() {
  const db = createDb();

  const trustedOrigins = [
    env.CORS_ORIGIN,
    env.BETTER_AUTH_TRUSTED_ORIGIN,
    env.VERCEL_BRANCH_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter((origin): origin is string => Boolean(origin));

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      ...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
        ? {
            discord: {
              clientId: env.DISCORD_CLIENT_ID,
              clientSecret: env.DISCORD_CLIENT_SECRET,
            },
          }
        : {}),
      ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: env.GITHUB_CLIENT_ID,
              clientSecret: env.GITHUB_CLIENT_SECRET,
            },
          }
        : {}),
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [
      anonymous({
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          try {
            const anonymousUserWatchlist = await db
              .select()
              .from(watchlist)
              .where(eq(watchlist.userId, anonymousUser.user.id));

            if (anonymousUserWatchlist.length === 0) return;

            await db
              .insert(watchlist)
              .values(
                anonymousUserWatchlist.map(({ resourceId, resourceType }) => ({
                  id: crypto.randomUUID(),
                  resourceId,
                  resourceType,
                  userId: newUser.user.id,
                })),
              )
              .onConflictDoNothing();
          } catch (error) {
            console.error("Failed to link your account:", error);
          }
        },
      }),
      passkey(),
      tanstackStartCookies(),
    ],
  });
}

export const auth = createAuth();
