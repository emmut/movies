import 'server-only';
import 'varlock/auto-load';
import { serve } from '@hono/node-server';
import { createTmdbFetch } from '@movies/api/tmdb-fetch';

import { createApp } from './app';
import { ENV } from './env';
import { createHomeService } from './home-service';

const app = createApp(
  createHomeService(createTmdbFetch(ENV.MOVIE_DB_ACCESS_TOKEN, ENV.TMDB_API_URL_OVERRIDE)),
  ENV.CORS_ORIGIN?.replace(/\/$/, '') ?? (ENV.NODE_ENV === 'production' ? '' : undefined),
);
serve({ fetch: app.fetch, port: ENV.PORT });
