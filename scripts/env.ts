import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    // Only the title sync needs TMDB; the IMDb ingest runs without it.
    MOVIE_DB_ACCESS_TOKEN: z.string().min(1).optional(),
    // Opt-in switches for the cron scripts. Off by default so a preview
    // environment (which forks every service) does not refresh the title
    // cache or load the search index unless someone turns it on; production
    // sets them in the Railway config.
    TITLE_SYNC_ENABLED: z.stringbool().default(false),
    SEARCH_INDEX_INGEST_ENABLED: z.stringbool().default(false),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    MOVIE_DB_ACCESS_TOKEN: process.env.MOVIE_DB_ACCESS_TOKEN,
    TITLE_SYNC_ENABLED: process.env.TITLE_SYNC_ENABLED,
    SEARCH_INDEX_INGEST_ENABLED: process.env.SEARCH_INDEX_INGEST_ENABLED,
  },
});
