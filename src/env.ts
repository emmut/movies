import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  server: {
    MOVIE_DB_ACCESS_TOKEN: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_TRUSTED_ORIGIN: z.string().min(1).optional(),
    DATABASE_URL: z.url(),
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_CLIENT_SECRET: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    VERCEL_BRANCH_URL: z
      .string()
      .min(1)
      .optional()
      .transform((val) => (val ? `https://${val}` : undefined)),
    VERCEL_PROJECT_PRODUCTION_URL: z
      .string()
      .min(1)
      .optional()
      .transform((val) => (val ? `https://${val}` : undefined)),
  },

  client: {
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1),
    NEXT_PUBLIC_IMAGEKIT_ID: z.string().min(1),
  },

  runtimeEnv: {
    MOVIE_DB_ACCESS_TOKEN: process.env.MOVIE_DB_ACCESS_TOKEN,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_TRUSTED_ORIGIN: process.env.BETTER_AUTH_TRUSTED_ORIGIN,
    DATABASE_URL: process.env.DATABASE_URL,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_IMAGEKIT_ID: process.env.NEXT_PUBLIC_IMAGEKIT_ID,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  },
});
