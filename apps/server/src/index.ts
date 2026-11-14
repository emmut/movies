import { serve } from '@hono/node-server';
import 'server-only';
import 'varlock/auto-load';
import { getConnInfo } from '@hono/node-server/conninfo';
import { createTmdbFetch } from '@movies/api/tmdb-fetch';
import { createImdbRatingStore } from '@movies/db/imdb-ratings';
import { createCatalogService } from '@movies/services/catalog-service';
import { createCustomListService } from '@movies/services/custom-list-service';
import { createDatabase } from '@movies/services/database';
import { createDiscoveryService } from '@movies/services/discovery-service';
import { createFuzzySearch } from '@movies/services/fuzzy-search';
import { createHomeService } from '@movies/services/home-service';
import { createPersonService } from '@movies/services/person-service';
import { createPreferencesService } from '@movies/services/preferences-service';
import { createSearchService } from '@movies/services/search-service';
import { createSystemListService } from '@movies/services/system-list-service';
import { createApp } from '@server/app';
import { authClientIp } from '@server/auth-client-ip';
import { createAuthGateway } from '@server/auth-gateway';
import { ENV } from '@server/env';
import { createLogger, createRequestLogger } from '@server/logger';

const fetchTmdb = createTmdbFetch(ENV.MOVIE_DB_ACCESS_TOKEN, ENV.TMDB_API_URL_OVERRIDE);
const database = createDatabase(ENV.DATABASE_URL, ENV.DB_POOL_MAX);
const logger = createLogger(ENV.LOG_LEVEL, ENV.NODE_ENV === 'development');
if (ENV.NODE_ENV === 'production' && ENV.AUTH_URL && !ENV.AUTH_PROXY_SECRET) {
  throw new Error('Production authentication forwarding requires AUTH_PROXY_SECRET');
}

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
    customLists: createCustomListService(database, fetchTmdb, (error) => {
      logger.error({ err: error }, 'Could not sync custom-list title');
    }),
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
    catalog: createCatalogService(fetchTmdb, {
      readRating: database ? createImdbRatingStore(database).read : undefined,
      onRatingError(error, input) {
        logger.error({ err: error, ...input }, 'Could not load IMDb rating');
      },
    }),
    discovery: createDiscoveryService(fetchTmdb),
  },
  resolveCorsOrigin(),
  [createRequestLogger(logger)],
  ENV.AUTH_URL ? createAuthGateway(ENV.AUTH_URL, fetch, ENV.AUTH_PROXY_SECRET) : undefined,
  (context) =>
    authClientIp(ENV.AUTH_IP_SOURCE, context.req.raw.headers, getConnInfo(context).remote.address),
);
serve({ fetch: app.fetch, port: ENV.PORT });
