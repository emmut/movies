import 'server-only';
import { regionSchema } from '@movies/config/regions';
import { cacheLife, cacheTag } from 'next/cache';

import { createServerApi } from '@/lib/api-server';

import { CACHE_TAGS } from './cache-tags';

type MediaType = 'movie' | 'tv';

/**
 * Fetches the first page of TMDb user reviews for a movie or TV show.
 *
 * @param mediaType - Whether the media is a 'movie' or 'tv' show.
 * @param mediaId - The TMDb ID of the title.
 * @param page - The 1-based result page (default 1).
 * @returns The reviews plus total review and page counts.
 */
export async function getMediaReviews(mediaType: MediaType, mediaId: number, page: number = 1) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public[mediaType].reviews(mediaId));
  cacheLife('hours');

  const result = await createServerApi(new Headers()).catalog.reviews({
    type: mediaType,
    id: mediaId,
    page,
  });
  return {
    reviews: result.reviews,
    totalResults: result.totalResults,
    totalPages: result.totalPages,
  };
}

/**
 * Fetches a title's age certification, preferring the user's region with a US
 * fallback. Movies read `/release_dates`; TV shows read `/content_ratings`.
 *
 * @param mediaType - Whether the media is a 'movie' or 'tv' show.
 * @param mediaId - The TMDb ID of the title.
 * @param userRegion - The preferred ISO 3166-1 region code.
 * @returns The certification and its source region, or null when unrated.
 */
export async function getMediaCertification(
  mediaType: MediaType,
  mediaId: number,
  userRegion: string,
) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public[mediaType].certifications(mediaId));
  cacheLife('days');

  return createServerApi(new Headers()).catalog.certification({
    type: mediaType,
    id: mediaId,
    region: regionSchema.parse(userRegion),
  });
}
