import { env } from '@/env';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  // Point at the barrel file, not the directory: drizzle-kit loads every
  // module under a directory path, including *.test.ts files, and vitest 5
  // can no longer be required from CommonJS.
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
