import { serve } from '@hono/node-server';
import 'server-only';
import 'varlock/auto-load';
import { getConnInfo } from '@hono/node-server/conninfo';
import { createTmdbFetch } from '@movies/api/tmdb-fetch';
import { createServices } from '@movies/services/create-services';
import { createDatabase } from '@movies/services/database';
import { readWikidataClaims } from '@movies/services/watch-links-service';
import { createApp } from '@server/app';
import { authClientIp } from '@server/auth-client-ip';
import { createAuthGateway } from '@server/auth-gateway';
import { createCacheInvalidator } from '@server/cache-invalidation';
import { ENV } from '@server/env';
import { createLogger, createRequestLogger } from '@server/logger';
import { cachePublicRead } from '@server/public-cache';

const TMDB_CACHE_MS = 60_000;
const WIKIDATA_CACHE_MS = 86_400_000;

const fetchTmdb = cachePublicRead(
  createTmdbFetch(ENV.MOVIE_DB_ACCESS_TOKEN, ENV.TMDB_API_URL_OVERRIDE),
  TMDB_CACHE_MS,
);
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

const webUrl = ENV.WEB_URL ?? ENV.AUTH_URL;
const auth = ENV.AUTH_URL
  ? createAuthGateway(ENV.AUTH_URL, fetch, ENV.AUTH_PROXY_SECRET)
  : undefined;
const onMutation =
  webUrl && ENV.AUTH_PROXY_SECRET
    ? createCacheInvalidator(webUrl, ENV.AUTH_PROXY_SECRET, {
        onError(error, event) {
          logger.error(
            { err: error, event },
            'Could not invalidate web caches after a committed mutation',
          );
        },
      })
    : undefined;
const app = createApp(
  createServices(fetchTmdb, database, {
    readWikidataClaims: cachePublicRead(readWikidataClaims, WIKIDATA_CACHE_MS),
    onCustomListSyncError(error) {
      logger.error({ err: error }, 'Could not sync custom-list title');
    },
    onSystemListSyncError(error, input) {
      logger.error(
        { err: error, resourceType: input.resourceType, resourceId: input.resourceId },
        'Title write-through failed',
      );
    },
    onRatingError(error, input) {
      logger.error({ err: error, ...input }, 'Could not load IMDb rating');
    },
  }),
  {
    origin: resolveCorsOrigin(),
    middleware: [createRequestLogger(logger)],
    auth,
    rpcProxySecret: ENV.AUTH_PROXY_SECRET,
    clientIp(context) {
      return authClientIp(
        ENV.AUTH_IP_SOURCE,
        context.req.raw.headers,
        getConnInfo(context).remote.address,
      );
    },
    onMutation,
  },
);
serve({ fetch: app.fetch, port: ENV.PORT });
