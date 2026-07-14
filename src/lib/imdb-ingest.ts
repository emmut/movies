import { lt, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { imdbRatings } from '@/db/schema/imdb-ratings';

// No 'server-only' here: the daily ingestion script (scripts/ingest-imdb-ratings.ts)
// runs under tsx outside the Next.js server runtime.

export type ImdbRatingRow = {
  imdbId: string;
  rating: string;
  numVotes: number;
};

function parseFiniteNumber(value: string | undefined) {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseVoteCount(value: string | undefined) {
  const parsed = parseFiniteNumber(value);
  return parsed !== null && Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Parses one TSV record from IMDb's title.ratings dataset into an upsert row.
 *
 * @param record - Raw column values keyed by header name.
 * @returns The parsed row, or null when any field is blank or non-numeric.
 */
export function parseRatingRecord(record: Record<string, string>): ImdbRatingRow | null {
  const { tconst, averageRating, numVotes } = record;
  const votes = parseVoteCount(numVotes);
  if (!tconst || parseFiniteNumber(averageRating) === null || votes === null) {
    return null;
  }
  return { imdbId: tconst, rating: averageRating, numVotes: votes };
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

/**
 * Deletes ratings that stopped appearing in the daily dataset — titles IMDb
 * has removed would otherwise keep their last-ingested rating forever. The
 * grace period is generous next to the daily cadence, so a few failed runs
 * never cause a purge of live data.
 *
 * @param database - The drizzle database handle to write through.
 * @returns The number of deleted rows.
 */
export async function deleteStaleRatings(database: NodePgDatabase) {
  const deleted = await database
    .delete(imdbRatings)
    .where(lt(imdbRatings.updatedAt, sql`now() - interval '7 days'`))
    .returning({ imdbId: imdbRatings.imdbId });
  return deleted.length;
}
