import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['nextjs', 'react', 'jsx-a11y'],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  jsPlugins: ['eslint-plugin-better-tailwindcss'],
  ignorePatterns: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  rules: {
    'better-tailwindcss/no-conflicting-classes': [
      'error',
      {
        entryPoint: './src/app/globals.css',
      },
    ],
  },
});
