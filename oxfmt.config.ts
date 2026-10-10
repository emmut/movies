import { defineConfig } from 'oxfmt';

export default defineConfig({
  singleQuote: true,
  jsxSingleQuote: false,
  ignorePatterns: ['apps/native/src/env.ts', 'apps/server/src/env.ts'],
  sortTailwindcss: {
    stylesheet: './src/app/globals.css',
    functions: ['cn', 'clsx'],
  },
  sortImports: {},
});
