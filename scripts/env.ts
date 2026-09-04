import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    // Only the title sync needs TMDB; the IMDb ingest runs without it.
    MOVIE_DB_ACCESS_TOKEN: z.string().min(1).optional(),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    MOVIE_DB_ACCESS_TOKEN: process.env.MOVIE_DB_ACCESS_TOKEN,
  },
});
