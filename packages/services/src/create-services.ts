import type { AppServices } from '@movies/api/router';
import 'server-only';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { createImdbRatingStore } from '@movies/db/imdb-ratings';

import { createCatalogService } from './catalog-service';
import { createCustomListService } from './custom-list-service';
import type { Database } from './database';
import { createDiscoveryService } from './discovery-service';
import { createFuzzySearch } from './fuzzy-search';
import { createHomeService } from './home-service';
import { createPersonService } from './person-service';
import { createPreferencesService } from './preferences-service';
import { createSearchService } from './search-service';
import { createSystemListService } from './system-list-service';
import type { WikidataClaimsReader } from './watch-links-service';

export function createServices(
  fetchTmdb: TmdbFetch,
  database: Database | undefined,
  options: { readWikidataClaims?: WikidataClaimsReader } = {},
): AppServices {
  return {
    customLists: createCustomListService(database, fetchTmdb, console.error),
    systemLists: createSystemListService(database, fetchTmdb, console.error),
    preferences: createPreferencesService(database, fetchTmdb),
    discovery: createDiscoveryService(fetchTmdb),
    home: createHomeService(fetchTmdb),
    person: createPersonService(fetchTmdb),
    search: createSearchService(fetchTmdb, createFuzzySearch(database)),
    catalog: createCatalogService(fetchTmdb, {
      readWikidataClaims: options.readWikidataClaims,
      readRating: database ? createImdbRatingStore(database).read : undefined,
    }),
  };
}
