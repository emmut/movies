import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import type { MovieReleaseDatesResponse, TvContentRatingsResponse } from '@/types/certification';
import type { TmdbReviewsResponse } from '@/types/review';

import { CACHE_TAGS } from './cache-tags';
import { pickMovieCertification, pickTvCertification } from './certifications';
import { tmdbFetch } from './tmdb';

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

  const reviews = await tmdbFetch<TmdbReviewsResponse>(`/${mediaType}/${mediaId}/reviews`, {
    searchParams: { page: String(page) },
    errorMessage: 'Failed loading reviews',
  });
  return {
    reviews: reviews.results,
    totalResults: reviews.total_results,
    totalPages: reviews.total_pages,
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

  if (mediaType === 'movie') {
    const releaseDates = await tmdbFetch<MovieReleaseDatesResponse>(
      `/movie/${mediaId}/release_dates`,
      { errorMessage: 'Failed loading movie release dates' },
    );
    return pickMovieCertification(releaseDates.results, userRegion);
  }

  const contentRatings = await tmdbFetch<TvContentRatingsResponse>(
    `/tv/${mediaId}/content_ratings`,
    { errorMessage: 'Failed loading TV show content ratings' },
  );
  return pickTvCertification(contentRatings.results, userRegion);
}
