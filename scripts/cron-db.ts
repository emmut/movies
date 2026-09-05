import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

import { waitForDatabase } from '@/lib/db-wait';

import { describeError } from './describe-error';

/**
 * Opens the pool a cron script writes through and waits until the database
 * answers. Preview databases sleep when idle, and the connection that wakes
 * one is dropped while the container boots, so the first query of a cron run
 * would otherwise fail outright. Mirrors `migrate-with-db-wait.ts`.
 *
 * @param connectionString - The database URL.
 * @param max - Pool size; one per concurrent worker the script runs.
 */
export async function connectForCron(connectionString: string, max: number) {
  const db = drizzle({
    connection: {
      connectionString,
      max,
      // Fail a stuck connection attempt in bounded time so the retry loop
      // below gets its turn instead of hanging on a booting container.
      connectionTimeoutMillis: 5_000,
    },
  });

  await waitForDatabase(() => db.execute(sql`select 1`), {
    onRetry(error, attempt) {
      console.warn(`⏳ Database not ready (attempt ${attempt}): ${describeError(error)}`);
    },
  });

  return db;
}
