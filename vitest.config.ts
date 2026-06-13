import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Resolve the `@/*` -> `src/*` path alias from tsconfig.
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Next.js poison-pill packages have no runtime in a plain Node test.
    alias: {
      'server-only': new URL('./src/test/empty-module.ts', import.meta.url).pathname,
      'client-only': new URL('./src/test/empty-module.ts', import.meta.url).pathname,
    },
    // Skip TMDB/auth env validation; modules under test are env-free or mock `@/env`.
    env: {
      SKIP_ENV_VALIDATION: 'true',
    },
  },
});
