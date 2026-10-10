import 'server-only';
import 'varlock/auto-load';
import { serve } from '@hono/node-server';
import { createTmdbFetch } from '@movies/api/tmdb-fetch';
import { createApp } from '@server/app';
import { createCatalogService } from '@server/catalog-service';
import { createDiscoveryService } from '@server/discovery-service';
import { ENV } from '@server/env';
import { createFuzzySearch } from '@server/fuzzy-search';
import { createHomeService } from '@server/home-service';
import { createLogger, createRequestLogger } from '@server/logger';
import { createPersonService } from '@server/person-service';
import { createSearchService } from '@server/search-service';

const fetchTmdb = createTmdbFetch(ENV.MOVIE_DB_ACCESS_TOKEN, ENV.TMDB_API_URL_OVERRIDE);
const logger = createLogger(ENV.LOG_LEVEL, ENV.NODE_ENV === 'development');
const app = createApp(
  {
    search: createSearchService(fetchTmdb, createFuzzySearch(ENV.DATABASE_URL, ENV.DB_POOL_MAX)),
    person: createPersonService(fetchTmdb),
    home: createHomeService(fetchTmdb),
    catalog: createCatalogService(fetchTmdb),
    discovery: createDiscoveryService(fetchTmdb),
  },
  ENV.CORS_ORIGIN?.replace(/\/$/, '') ?? (ENV.NODE_ENV === 'production' ? '' : undefined),
  [createRequestLogger(logger)],
);
serve({ fetch: app.fetch, port: ENV.PORT });
