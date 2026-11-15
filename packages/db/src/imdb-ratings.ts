import 'server-only';
import { imdbIdSchema, imdbRatingSchema, type ImdbRating } from '@movies/api/imdb';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { imdbRatings } from './schema/imdb-ratings';

/** Hosts supply their database/cache and decide how optional-rating failures are presented. */
export function createImdbRatingStore<TSchema extends Record<string, unknown>>(
  db: NodePgDatabase<TSchema>,
) {
  async function read(imdbId: string): Promise<ImdbRating | null> {
    if (!imdbIdSchema.safeParse(imdbId).success) {
      return null;
    }
    const rows = await db
      .select({ rating: imdbRatings.rating, numVotes: imdbRatings.numVotes })
      .from(imdbRatings)
      .where(eq(imdbRatings.imdbId, imdbId))
      .limit(1);
    if (rows.length === 0) {
      return null;
    }
    return imdbRatingSchema.parse({ rating: Number(rows[0].rating), numVotes: rows[0].numVotes });
  }
  return { read };
}
