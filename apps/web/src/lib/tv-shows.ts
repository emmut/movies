import 'server-only';
import type { GenreResponse } from '@movies/api/tmdb-types/genre';
import {
  TvCredits,
  TvDetails,
  TvRecommendations,
  TvSimilar,
  TvWatchProviders,
} from '@movies/api/tmdb-types/tv-show';
import { cacheLife, cacheTag } from 'next/cache';

import { CACHE_TAGS } from './cache-tags';
import { tmdbFetch } from './tmdb';
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

  return await tmdbFetch<TvDetails>(`/tv/${tvId}`, {
    errorMessage: 'Failed loading TV show details',
  });
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

  return await tmdbFetch<TvCredits>(`/tv/${resourceId}/credits`, {
    errorMessage: 'Failed loading tv credits',
  });
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

  const watchProviders = await tmdbFetch<TvWatchProviders>(`/tv/${tvId}/watch/providers`, {
    errorMessage: 'Failed loading tv watch providers',
  });

  return {
    results: watchProviders.results,
  };
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

  const tvGenres = await tmdbFetch<GenreResponse>('/genre/tv/list', {
    errorMessage: 'Error loading TV genres',
  });
  return tvGenres.genres;
}

export async function getTvShowSimilar(tvId: number, userRegion?: string) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.tv.similar(tvId));
  cacheLife('hours');

  const tvShows = await tmdbFetch<TvSimilar>(`/tv/${tvId}/similar`, {
    searchParams: { region: userRegion },
    errorMessage: 'Failed loading similar TV shows',
  });
  return tvShows.results;
}

export async function getTvShowRecommendations(tvId: number, userRegion?: string) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.tv.recommendations(tvId));
  cacheLife('hours');

  const tvShows = await tmdbFetch<TvRecommendations>(`/tv/${tvId}/recommendations`, {
    searchParams: { region: userRegion },
    errorMessage: 'Failed loading TV show recommendations',
  });
  return tvShows.results;
}

export async function getTvShowImdbId(tvId: number) {
  const data = await getTmdbExternalIds('tv', tvId);
  return data.imdb_id;
}
