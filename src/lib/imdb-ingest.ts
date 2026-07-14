import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { imdbRatings } from '@/db/schema/imdb-ratings';

// No 'server-only' here: the daily ingestion script (scripts/ingest-imdb-ratings.ts)
// runs under tsx outside the Next.js server runtime.

export type ImdbRatingRow = {
  imdbId: string;
  rating: string;
  numVotes: number;
};

/**
 * Parses one line of IMDb's title.ratings.tsv into an insertable row.
 *
 * Format: `tconst\taverageRating\tnumVotes`. Returns null for the header and
 * malformed lines (the header's "averageRating" fails the numeric check, so it
 * needs no special case).
 *
 * @param line - A single line from the TSV file.
 * @returns The parsed row, or null when the line should be skipped.
 */
export function parseRatingLine(line: string): ImdbRatingRow | null {
  const parts = line.split('\t');
  if (parts.length !== 3) {
    return null;
  }

  const [imdbId, rating, votes] = parts;
  if (votes === '' || !Number.isFinite(Number(rating)) || !Number.isInteger(Number(votes))) {
    return null;
  }
  const numVotes = Number(votes);

  return { imdbId, rating, numVotes };
}

/**
 * Upserts a batch of IMDb rating rows, refreshing rating, vote count, and
 * updated_at for rows that already exist.
 *
 * @param database - The drizzle database handle to write through.
 * @param rows - Parsed rating rows; a no-op when empty.
 */
export async function upsertRatingsBatch(database: NodePgDatabase, rows: ImdbRatingRow[]) {
  if (rows.length === 0) {
    return;
  }

  await database
    .insert(imdbRatings)
    .values(rows)
    .onConflictDoUpdate({
      target: imdbRatings.imdbId,
      set: {
        rating: sql`excluded.rating`,
        numVotes: sql`excluded.num_votes`,
        updatedAt: sql`now()`,
      },
    });
}
