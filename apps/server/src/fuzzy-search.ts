import 'server-only';
import type { SearchSources } from '@movies/api/search-engine';
import { createSearchIndexReader } from '@movies/db/search-index';
import type { Database } from '@server/database';

/** The host owns the connection; SQL, ranking and deadlines remain shared with web. */
export function createFuzzySearch(database?: Database): SearchSources['fuzzy'] {
  if (!database) {
    return async function noIndex() {
      return [];
    };
  }
  return createSearchIndexReader(database).searchIndexFuzzy;
}
