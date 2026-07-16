import { drizzle } from 'drizzle-orm/node-postgres';

import { env } from '@/env';

function createDb() {
  return drizzle({
    connection: {
      connectionString: env.DATABASE_URL,
      // Keep pooled connections warm between requests. Opening a fresh
      // connection to the prod database can take tens of seconds when its
      // compute has to cold-wake, so dropping idle connections aggressively
      // made almost every request pay that cold-connect cost. Hold idle
      // connections for a few minutes instead, and enable TCP keepalive so the
      // pool notices a peer that went away rather than handing out a dead
      // socket. Assumes the app service does not scale to zero (otherwise the
      // whole pool dies with the container regardless).
      idleTimeoutMillis: 5 * 60_000,
      keepAlive: true,
      // Fail a stuck connection attempt in bounded time instead of hanging the
      // request indefinitely; must stay above the DB's cold-wake latency.
      connectionTimeoutMillis: 30_000,
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
