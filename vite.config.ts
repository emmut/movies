import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite-plus';

const emptyModule = new URL('./apps/web/src/test/empty-module.ts', import.meta.url).pathname;

export default defineConfig({
  fmt: {
    singleQuote: true,
    jsxSingleQuote: false,
    // Match the existing formatter scripts' apps/packages/scripts scope.
    ignorePatterns: ['/*', '!/apps/', '!/packages/', '!/scripts/', '!/vite.config.ts'],
    sortTailwindcss: {
      stylesheet: './apps/web/src/app/globals.css',
      functions: ['cn', 'clsx'],
    },
    sortImports: {},
  },
  lint: {
    plugins: ['nextjs', 'react', 'jsx-a11y'],
    options: { typeAware: true, typeCheck: true },
    jsPlugins: [
      'eslint-plugin-better-tailwindcss',
      { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
    ],
    ignorePatterns: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
      'better-tailwindcss/no-conflicting-classes': [
        'error',
        { entryPoint: './apps/web/src/app/globals.css' },
      ],
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['apps/web/src/**/*.{test,spec}.{ts,tsx}', 'packages/**/*.{test,spec}.{ts,tsx}'],
    alias: [
      // The single `@/* -> src/*` tsconfig path mapping, inlined (no plugin/dep).
      { find: /^@\//, replacement: fileURLToPath(new URL('./apps/web/src/', import.meta.url)) },
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
