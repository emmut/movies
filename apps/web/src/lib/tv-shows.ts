import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';

import { createServerApi } from '@/lib/api-server';

import { CACHE_TAGS } from './cache-tags';
import { getTmdbExternalIds } from './tmdb-external-ids';

/**
 * Fetches detailed information for a TV show from TMDb by its ID.
 *
 * @param tvId - The TMDb ID of the TV show.
 * @returns The TV show's detailed information.
 *
 * @throws If the TV show details cannot be loaded from the API.
 */
export async function getTvShowDetails(tvId: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.tv.details(tvId));
  // Near-static data, fanned out once per row on list pages — keep it warm.
  cacheLife('hours');

  return createServerApi(new Headers()).catalog.tvDetails({ id: tvId });
}

/**
 * Fetches cast and crew credits for a TV show by its TMDb ID.
 *
 * @param resourceId - The TMDb ID of the TV show.
 * @returns The cast and crew credits for the specified TV show.
 *
 * @throws {Error} If the credits cannot be loaded from TMDb.
 */
export async function getTvShowCredits(resourceId: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.tv.credits(resourceId));
  cacheLife('minutes');

  return createServerApi(new Headers()).catalog.tvCredits({ id: resourceId });
}

/**
 * Fetches watch provider information for a TV show by its TMDb ID.
 *
 * @param tvId - The TMDb ID of the TV show.
 * @returns An object containing watch provider data and the associated results for the specified TV show.
 *
 * @throws If the watch provider data cannot be loaded from the API.
 */
export async function getTvShowWatchProviders(tvId: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.tv.watchProviders(tvId));
  // Same lifetime as the movie equivalent: provider availability changes
  // rarely, and the provider filter fans this out once per list row.
  cacheLife('days');

  return createServerApi(new Headers()).catalog.availability({ type: 'tv', id: tvId });
}

/**
 * Fetches the list of available TV genres from TMDb.
 *
 * @returns An array of TV genre objects.
 *
 * @throws If the TV genres cannot be loaded from TMDb.
 */
export async function fetchAvailableTvGenres() {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.genres.tv);
  cacheLife('biweekly');

  return createServerApi(new Headers()).discovery.genres({ type: 'tv' });
}

export async function getTvShowSimilar(tvId: number, userRegion?: string) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.tv.similar(tvId));
  cacheLife('hours');

  return createServerApi(new Headers()).catalog.related({
    type: 'tv',
    id: tvId,
    region: userRegion,
    kind: 'similar',
  });
}

export async function getTvShowRecommendations(tvId: number, userRegion?: string) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.tv.recommendations(tvId));
  cacheLife('hours');

  return createServerApi(new Headers()).catalog.related({
    type: 'tv',
    id: tvId,
    region: userRegion,
    kind: 'recommendations',
  });
}

export async function getTvShowImdbId(tvId: number) {
  const data = await getTmdbExternalIds('tv', tvId);
  return data.imdb_id;
}
