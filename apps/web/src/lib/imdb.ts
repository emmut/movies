import 'server-only';
import { imdbIdSchema, type ImdbRating } from '@movies/api/imdb';
import { createImdbRatingStore } from '@movies/db/imdb-ratings';
import { cacheLife, cacheTag } from 'next/cache';

import { db } from '@/lib/db';

import { CACHE_TAGS } from './cache-tags';

const imdbStore = createImdbRatingStore(db);

async function fetchImdbRating(imdbId: string): Promise<ImdbRating | null> {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.imdb.rating(imdbId));
  // The imdb-ingest cron refreshes the table daily; time-based expiry matches
  // that cadence (nothing revalidates the tag).
  cacheLife('days');

  return imdbStore.read(imdbId);
}

/**
 * Looks up the locally ingested IMDb rating for a title.
 *
 * @param imdbId - The IMDb id (e.g. tt0111161); null/undefined when TMDb has no mapping.
 * @returns The rating and vote count, or null when unknown.
 */
export async function getImdbRating(imdbId: string | null | undefined) {
  const parsedId = imdbIdSchema.safeParse(imdbId);
  if (!parsedId.success) {
    return null;
  }
  // Ratings are optional everywhere they render (the card is hidden), so a
  // failed lookup must not take the page down with it. Caught out here rather
  // than inside fetchImdbRating so the error result is never cached.
  try {
    return await fetchImdbRating(parsedId.data);
  } catch (error) {
    console.error(`Error fetching IMDb rating for ${imdbId}:`, error);
    return null;
  }
}
