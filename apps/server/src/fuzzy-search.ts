import 'server-only';
import type { SearchSources } from '@movies/api/search-engine';
import { createSearchIndexReader } from '@movies/db/search-index';
import { drizzle } from 'drizzle-orm/node-postgres';

/** The host owns connection settings; SQL, ranking and deadlines remain shared with web. */
export function createFuzzySearch(databaseUrl?: string, poolMax = 3): SearchSources['fuzzy'] {
  if (!databaseUrl)
    return async function noIndex() {
      return [];
    };
  const database = drizzle({
    connection: {
      connectionString: databaseUrl,
      max: poolMax,
      min: 1,
      keepAlive: true,
      idleTimeoutMillis: 5 * 60_000,
      connectionTimeoutMillis: 60_000,
    },
  });
  return createSearchIndexReader(database).searchIndexFuzzy;
}
