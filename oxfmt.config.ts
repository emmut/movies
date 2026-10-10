import { defineConfig } from 'oxfmt';

export default defineConfig({
  singleQuote: true,
  jsxSingleQuote: false,
  ignorePatterns: ['apps/native/src/env.ts', 'apps/server/src/env.ts'],
  sortTailwindcss: {
    stylesheet: './apps/web/src/app/globals.css',
    functions: ['cn', 'clsx'],
  },
  sortImports: {},
});
