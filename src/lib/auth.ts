import * as schema from '@/db/schema';
import { env } from '@/env';
import { db } from '@/lib/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { anonymous } from 'better-auth/plugins';

export const auth = betterAuth({
  trustedOrigins: [env.VERCEL_URL],
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

  plugins: [nextCookies(), anonymous()],
});
