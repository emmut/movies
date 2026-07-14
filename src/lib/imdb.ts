'use server';

import { eq } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';

import { imdbRatings } from '@/db/schema/imdb-ratings';
import { db } from '@/lib/db';

import { CACHE_TAGS } from './cache-tags';

export type ImdbRating = {
  rating: number;
  numVotes: number;
};

async function fetchImdbRating(imdbId: string): Promise<ImdbRating | null> {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.imdb.rating(imdbId));
  // The imdb-ingest cron refreshes the table daily; time-based expiry matches
  // that cadence (nothing revalidates the tag).
  cacheLife('days');

  const rows = await db
    .select({ rating: imdbRatings.rating, numVotes: imdbRatings.numVotes })
    .from(imdbRatings)
    .where(eq(imdbRatings.imdbId, imdbId))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  return { rating: Number(rows[0].rating), numVotes: rows[0].numVotes };
}

/**
 * Looks up the locally ingested IMDb rating for a title.
 *
 * @param imdbId - The IMDb id (e.g. tt0111161); null/undefined when TMDb has no mapping.
 * @returns The rating and vote count, or null when unknown.
 */
export async function getImdbRating(imdbId: string | null | undefined) {
  if (!imdbId) {
    return null;
  }
  return fetchImdbRating(imdbId);
}
