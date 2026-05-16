import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_TRUSTED_ORIGIN: z.string().min(1).optional(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    MOVIE_DB_ACCESS_TOKEN: z.string().min(1),

    DISCORD_CLIENT_ID: z.string().min(1).optional(),
    DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),

    IMGPROXY_KEY: z.string().min(1).optional(),
    IMGPROXY_SALT: z.string().min(1).optional(),
    IMGPROXY_ENDPOINT: z.url().optional(),
    IMGPROXY_BASE_URL: z.url().optional(),

    POSTHOG_KEY: z.string().min(1).optional(),
    POSTHOG_HOST: z.string().min(1).optional(),

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
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
