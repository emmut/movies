import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const emptyModule = new URL('./src/test/empty-module.ts', import.meta.url).pathname;

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    alias: [
      // The single `@/* -> src/*` tsconfig path mapping, inlined (no plugin/dep).
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
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
