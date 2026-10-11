import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const emptyModule = new URL('./apps/web/src/test/empty-module.ts', import.meta.url).pathname;

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      'apps/web/src/**/*.{test,spec}.{ts,tsx}',
      'packages/**/*.{test,spec}.{ts,tsx}',
      'apps/server/src/**/*.test.ts',
      'apps/native/lib/**/*.test.ts',
    ],
    alias: [
      // Workspace aliases mirror their tsconfig mappings without an extra plugin.
      { find: /^@\//, replacement: fileURLToPath(new URL('./apps/web/src/', import.meta.url)) },
      {
        find: /^@native\//,
        replacement: fileURLToPath(new URL('./apps/native/', import.meta.url)),
      },
      {
        find: /^@server\//,
        replacement: fileURLToPath(new URL('./apps/server/src/', import.meta.url)),
      },
      // Next.js poison-pill packages have no runtime in a plain Node test.
      { find: 'server-only', replacement: emptyModule },
      { find: 'client-only', replacement: emptyModule },
    ],
    // Skip TMDB/auth env validation; modules under test are env-free or mock `@/env`.
    env: {
      SKIP_ENV_VALIDATION: 'true',
    },
  },
});
