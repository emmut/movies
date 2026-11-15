import { vi } from 'vite-plus/test';

import type { CoercedEnvSchema } from '@/env';

// Unit tests run outside Next's Varlock loader and never need deployment credentials.
// A test can override this boundary when it needs a particular configuration.
vi.mock('@/env', () => ({
  ENV: {
    NODE_ENV: 'test',
    API_URL: 'http://localhost:3001',
    RPC_IP_SOURCE: 'none',
    MOVIE_DB_ACCESS_TOKEN: 'unit-test-movies-token',
    BETTER_AUTH_SECRET: 'unit-test-auth-secret-at-least-32-characters',
    DATABASE_URL: 'postgres://test:test@localhost/movies_test',
    DB_POOL_MAX: 1,
    AUTH_RATE_LIMIT_DISABLED: false,
    DISCORD_CLIENT_ID: 'unit-test-discord-id',
    DISCORD_CLIENT_SECRET: 'unit-test-discord-secret',
    GITHUB_CLIENT_ID: 'unit-test-github-id',
    GITHUB_CLIENT_SECRET: 'unit-test-github-secret',
    IMGPROXY_KEY: 'a'.repeat(64),
    IMGPROXY_SALT: 'b'.repeat(64),
    NEXT_PUBLIC_IMGPROXY_ENDPOINT: 'http://localhost:8080',
    NEXT_PUBLIC_IMGPROXY_BASE_URL: 'https://image.tmdb.org/t/p/original',
    NEXT_PUBLIC_POSTHOG_KEY: 'unit-test-public-analytics-key',
    NEXT_PUBLIC_POSTHOG_HOST: 'https://eu.i.posthog.com',
    NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
  } satisfies CoercedEnvSchema,
}));
