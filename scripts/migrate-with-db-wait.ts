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
    // Well past the default 60s: a brand-new PR environment's postgres boots
    // for the first time here (image pull + volume init), which can outlast
    // the steady-state ~1-3s sleep wake-up by minutes. A pre-deploy can
    // afford the wait, and a genuinely broken database still fails the
    // deploy at the deadline.
    timeoutMs: 5 * 60_000,
    onRetry(error, attempt) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⏳ Database not ready (attempt ${attempt}): ${message}`);
    },
  });

  console.log('✅ Database ready; applying migrations');
  const beforeMigrations = await db.execute(sql`
    select hash from "__drizzle_migrations"
  `);
  const beforeHashes = new Set(beforeMigrations.rows.map((r) => r.hash as string));

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
  } finally {
    await db.$client.end();
  }
  console.log('✅ Migrations applied');

  // Reclaim physical storage only if the column-drop migration (0018) was newly applied
  const afterMigrations = await db.execute(sql`
    select hash from "__drizzle_migrations"
  `);
  const newMigrations = afterMigrations.rows
    .map((r) => r.hash as string)
    .filter((hash) => !beforeHashes.has(hash));

  const COLUMN_DROP_MIGRATION = '0018_woozy_lightspeed';
  const shouldVacuum = newMigrations.some((hash) => hash.startsWith(COLUMN_DROP_MIGRATION));

  if (shouldVacuum) {
    console.log('🧹 Running VACUUM FULL on search_index to reclaim storage...');
    const vacuumDb = drizzle({
      connection: {
        connectionString: env.DATABASE_URL,
        connectionTimeoutMillis: 5_000,
      },
    });
    try {
      await vacuumDb.execute(sql`VACUUM FULL "search_index"`);
      console.log('✅ VACUUM FULL completed');
    } catch (error) {
      console.warn('⚠️ VACUUM FULL failed (may need manual run):', error instanceof Error ? error.message : String(error));
    } finally {
      await vacuumDb.$client.end();
    }
  } else {
    console.log('⏭️ Skipping VACUUM FULL — column-drop migration not newly applied');
  }
}

main().catch((error) => {
  console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
