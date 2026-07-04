import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  server: {
    MOVIE_DB_ACCESS_TOKEN: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_TRUSTED_ORIGIN: z.string().min(1).optional(),
    DATABASE_URL: z.url(),
    // Max TCP connections this instance's pool holds open. Serverless/
    // scale-to-zero runs many instances, each with its own pool, so
    // max × instances must stay under the database connection limit.
    // Keep small; raise only for a single persistent container.
    DB_POOL_MAX: z.coerce.number().int().positive().default(3),
    // Turns off better-auth's rate limiter (its default 3 sign-ins per 10s
    // per IP would 429 the e2e suite, which mints anonymous users from one
    // IP). Only set by the Playwright-managed server — never in real deploys.
    AUTH_RATE_LIMIT_DISABLED: z.stringbool().default(false),
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_CLIENT_SECRET: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    IMGPROXY_KEY: z.string().min(1),
    IMGPROXY_SALT: z.string().min(1),
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
    NEXT_PUBLIC_IMGPROXY_ENDPOINT: z.url(),
    NEXT_PUBLIC_IMGPROXY_BASE_URL: z.url(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1),
    NEXT_PUBLIC_BASE_URL: z.url(),
  },

  runtimeEnv: {
    MOVIE_DB_ACCESS_TOKEN: process.env.MOVIE_DB_ACCESS_TOKEN,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_TRUSTED_ORIGIN: process.env.BETTER_AUTH_TRUSTED_ORIGIN,
    DATABASE_URL: process.env.DATABASE_URL,
    DB_POOL_MAX: process.env.DB_POOL_MAX,
    AUTH_RATE_LIMIT_DISABLED: process.env.AUTH_RATE_LIMIT_DISABLED,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    IMGPROXY_KEY: process.env.IMGPROXY_KEY,
    IMGPROXY_SALT: process.env.IMGPROXY_SALT,
    NEXT_PUBLIC_IMGPROXY_ENDPOINT: process.env.NEXT_PUBLIC_IMGPROXY_ENDPOINT,
    NEXT_PUBLIC_IMGPROXY_BASE_URL: process.env.NEXT_PUBLIC_IMGPROXY_BASE_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  },

  // Skip validation in test/CI where the full secret set is absent.
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
