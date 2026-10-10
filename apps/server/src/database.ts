import 'server-only';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';

export type Database = NodePgDatabase;

/**
 * One bounded pool per API instance, shared by every database-backed service.
 * Without a URL the API still serves TMDB-backed reads.
 */
export function createDatabase(databaseUrl?: string, poolMax = 3): Database | undefined {
  if (!databaseUrl) {
    return undefined;
  }
  return drizzle({
    connection: {
      connectionString: databaseUrl,
      max: poolMax,
      min: 1,
      keepAlive: true,
      idleTimeoutMillis: 5 * 60_000,
      connectionTimeoutMillis: 60_000,
    },
  });
}
