import 'server-only';
import 'varlock/auto-load';
import { serve } from '@hono/node-server';
import { createTmdbFetch } from '@movies/api/tmdb-fetch';
import { createApp } from '@server/app';
import { createAuthGateway } from '@server/auth-gateway';
import { createCatalogService } from '@server/catalog-service';
import { createDatabase } from '@server/database';
import { createDiscoveryService } from '@server/discovery-service';
import { ENV } from '@server/env';
import { createFuzzySearch } from '@server/fuzzy-search';
import { createHomeService } from '@server/home-service';
import { createLogger, createRequestLogger } from '@server/logger';
import { createPersonService } from '@server/person-service';
import { createPreferencesService } from '@server/preferences-service';
import { createSearchService } from '@server/search-service';
import { createSystemListService } from '@server/system-list-service';

const fetchTmdb = createTmdbFetch(ENV.MOVIE_DB_ACCESS_TOKEN, ENV.TMDB_API_URL_OVERRIDE);
const database = createDatabase(ENV.DATABASE_URL, ENV.DB_POOL_MAX);
const logger = createLogger(ENV.LOG_LEVEL, ENV.NODE_ENV === 'development');

/** Configured origin without a trailing slash; production without one allows no origin. */
function resolveCorsOrigin() {
  if (ENV.CORS_ORIGIN !== undefined) {
    return ENV.CORS_ORIGIN.replace(/\/$/, '');
  }
  if (ENV.NODE_ENV === 'production') {
    return '';
  }
  return undefined;
}

const app = createApp(
  {
    systemLists: createSystemListService(database, fetchTmdb, (error, input) => {
      logger.error(
        { err: error, resourceType: input.resourceType, resourceId: input.resourceId },
        'Title write-through failed',
      );
    }),
    preferences: createPreferencesService(database, fetchTmdb),
    search: createSearchService(fetchTmdb, createFuzzySearch(database)),
    person: createPersonService(fetchTmdb),
    home: createHomeService(fetchTmdb),
    catalog: createCatalogService(fetchTmdb),
    discovery: createDiscoveryService(fetchTmdb),
  },
  resolveCorsOrigin(),
  [createRequestLogger(logger)],
  ENV.AUTH_URL ? createAuthGateway(ENV.AUTH_URL) : undefined,
);
serve({ fetch: app.fetch, port: ENV.PORT });
