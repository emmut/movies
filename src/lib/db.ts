import { drizzle } from 'drizzle-orm/node-postgres';

import { env } from '@/env';

function createDb() {
  return drizzle({
    connection: {
      connectionString: env.DATABASE_URL,
      // Scale-to-zero (Railway) + autosuspend (Neon): drop idle connections so a
      // resumed container reconnects cleanly instead of reusing a dead socket.
      idleTimeoutMillis: 10_000,
      // Cap connections PER instance. Serverless/scale-to-zero spins up many
      // instances, each with its own pool; total = max × instances must stay
      // under the database connection limit. Front the DB with a pooler
      // (PgBouncer / Neon pooled endpoint) for large fan-out.
      max: env.DB_POOL_MAX,
    },
  });
}

type Database = ReturnType<typeof createDb>;

// One pool per process. Next.js re-evaluates this module on HMR (dev) and can
// hold a warm module across serverless invocations, so without a singleton each
// reload would leak another pool and multiply open connections.
const globalForDb = globalThis as unknown as { db?: Database };

export const db = globalForDb.db ?? createDb();
globalForDb.db = db;
