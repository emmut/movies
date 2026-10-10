import 'server-only';
import { serve } from '@hono/node-server';
import { createTmdbFetch } from '@movies/api/tmdb-fetch';

import { createApp } from './app';
import { createHomeService } from './home-service';

const token = process.env.MOVIE_DB_ACCESS_TOKEN;
if (!token) throw new Error('Set MOVIE_DB_ACCESS_TOKEN in apps/server/.env');
const app = createApp(
  createHomeService(createTmdbFetch(token)),
  process.env.CORS_ORIGIN ?? (process.env.NODE_ENV === 'production' ? '' : undefined),
);
serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3001) });
