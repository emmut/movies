#!/usr/bin/env tsx

/**
 * Waits for the database to accept connections, then applies the committed
 * drizzle migrations over that same pool.
 *
 * Usage:
 *   pnpm db:migrate:railway
 *
 * Runs as the Railway pre-deploy command. PR environments sleep their
 * postgres-db when idle, and the connection that wakes it is dropped while
 * the container boots (~1-3s). `drizzle-kit migrate` makes a single
 * connection attempt, so calling it directly fails the whole deploy;
 * polling here absorbs the wake-up first. Uses drizzle-orm's programmatic
 * migrator instead of shelling out to drizzle-kit, so migration errors
 * surface in the deploy logs instead of being swallowed by its spinner.
 */

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { waitForDatabase } from '@/lib/db-wait';

import { env } from './env';

const db = drizzle({
  connection: {
    connectionString: env.DATABASE_URL,
    // Without a cap a connection to a still-booting container can hang
    // indefinitely instead of failing into the next retry.
    connectionTimeoutMillis: 5_000,
  },
});

async function tryConnect() {
  await db.execute(sql`select 1`);
}

async function main() {
  await waitForDatabase(tryConnect, {
    onRetry(error, attempt) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⏳ Database not ready (attempt ${attempt}): ${message}`);
    },
  });

  console.log('✅ Database ready; applying migrations');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
  } finally {
    await db.$client.end();
  }
  console.log('✅ Migrations applied');
}

main().catch((error) => {
  console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
