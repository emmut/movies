import { serve } from '@hono/node-server';
import 'server-only';
import 'varlock/auto-load';
import { getConnInfo } from '@hono/node-server/conninfo';
import { createTmdbFetch } from '@movies/api/tmdb-fetch';
import { createAuth } from '@movies/auth';
import { createServices } from '@movies/services/create-services';
import { createDatabase } from '@movies/services/database';
import { readWikidataClaims } from '@movies/services/watch-links-service';
import { createApp } from '@server/app';
import { authClientIp } from '@server/auth-client-ip';
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

const webUrl = ENV.WEB_URL;
const auth =
  ENV.BETTER_AUTH_URL && database
    ? createAuth(
        {
          ...ENV,
          BETTER_AUTH_URL: ENV.BETTER_AUTH_URL,
          BETTER_AUTH_SECRET: ENV.BETTER_AUTH_SECRET!,
          DISCORD_CLIENT_ID: ENV.DISCORD_CLIENT_ID!,
          DISCORD_CLIENT_SECRET: ENV.DISCORD_CLIENT_SECRET!,
          GITHUB_CLIENT_ID: ENV.GITHUB_CLIENT_ID!,
          GITHUB_CLIENT_SECRET: ENV.GITHUB_CLIENT_SECRET!,
        },
        database,
      )
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
