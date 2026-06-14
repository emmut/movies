'use server';

import { cacheLife, cacheTag } from 'next/cache';

import type { GenreResponse } from '@/types/genre';
import { TmdbVideoResponse } from '@/types/tmdb-video';
import {
  TmdbExternalIdsResponse,
  TvCredits,
  TvDetails,
  TvRecommendations,
  TvResponse,
  TvSimilar,
  TvWatchProviders,
} from '@/types/tv-show';

import { CACHE_TAGS } from './cache-tags';
import { buildDiscoverSearchParams } from './discover-params';
import { DEFAULT_REGION } from './regions';
import { addPosterImageUrls, tmdbFetch } from './tmdb';

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
  cacheLife('minutes');

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
  cacheLife('minutes');

  const watchProviders = await tmdbFetch<TvWatchProviders>(`/tv/${tvId}/watch/providers`, {
    errorMessage: 'Failed loading tv watch providers',
  });

  return {
    results: watchProviders.results,
  };
}

/**
 * Retrieves a paginated list of TV shows filtered by genre, sort order, watch providers, and region for the default region.
 *
 * Returns an object containing the list of TV shows and the total number of pages (capped at 500).
 *
 * @param genreId - The genre ID to filter TV shows by; use 0 to include all genres.
 * @param page - The page number to retrieve (default is 1).
 * @param sortBy - Optional sort order for the TV shows.
 * @param watchProviders - Optional watch provider filter.
 * @param watchRegion - Optional region filter for watch providers.
 * @param withRuntimeLte - Optional maximum runtime filter (less than or equal to).
 * @returns An object with the filtered TV shows and the total number of pages (maximum 500).
 *
 * @throws {Error} If the TV show discovery data cannot be loaded from the API.
 */
export async function fetchDiscoverTvShows(
  genreId: number,
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string,
  withRuntimeLte?: number,
) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.discover.tv);
  cacheLife('minutes');

  const searchParams = buildDiscoverSearchParams({
    genreId,
    page,
    sortBy,
    watchProviders,
    watchRegion,
    withRuntimeLte,
  });

  const tvShows = await tmdbFetch<TvResponse>('/discover/tv', {
    searchParams,
    errorMessage: 'Error loading discover tv shows',
  });

  return { tvShows: tvShows.results.map(addPosterImageUrls), totalPages: Math.min(tvShows.total_pages, 500) };
}

/**
 * Fetches the list of trending TV shows for the current day from TMDb.
 *
 * @returns An array of trending TV shows for today.
 *
 * @throws If the trending TV shows cannot be loaded from the API.
 */
export async function fetchTrendingTvShows() {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.home.trendingTv);
  cacheLife('minutes');

  const tvShows = await tmdbFetch<TvResponse>('/trending/tv/day', {
    errorMessage: 'Failed loading trending TV shows',
  });
  return tvShows.results;
}

/**
 * Fetches the list of top-rated TV shows for the default region.
 *
 * @returns An array of top-rated TV show objects.
 *
 * @throws If the request to the TMDb API fails.
 */
export async function fetchTopRatedTvShows(region: string = DEFAULT_REGION) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.home.topRatedTv);
  cacheLife('days');

  const tvShows = await tmdbFetch<TvResponse>('/tv/top_rated', {
    searchParams: { region },
    errorMessage: 'Failed loading top rated TV shows',
  });
  return tvShows.results;
}

/**
 * Fetches TV shows that are currently airing in the default region.
 *
 * @returns An array of TV show objects currently on the air in the default region.
 *
 * @throws If the request to the TMDb API fails.
 */
export async function fetchOnTheAirTvShows(region: string = DEFAULT_REGION) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.home.onTheAirTv);
  cacheLife('days');

  const tvShows = await tmdbFetch<TvResponse>('/tv/on_the_air', {
    searchParams: { region },
    errorMessage: 'Failed loading on the air TV shows',
  });
  return tvShows.results;
}

/**
 * Fetches a list of popular TV shows for the default region.
 *
 * @returns An array of popular TV shows.
 *
 * @throws If the request to the TMDb API fails.
 */
export async function fetchPopularTvShows(region: string = DEFAULT_REGION) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.home.popularTv);
  cacheLife('days');

  const tvShows = await tmdbFetch<TvResponse>('/tv/popular', {
    searchParams: { region },
    errorMessage: 'Failed loading popular TV shows',
  });
  return tvShows.results;
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

/**
 * Retrieves the YouTube video key for a trailer or teaser of a TV show by its TMDb ID.
 *
 * Searches for a video of type "Trailer" or "Teaser" hosted on YouTube. Returns the video key if found, or null if no suitable video exists or an error occurs.
 *
 * @param tvId - The TMDb ID of the TV show
 * @returns The YouTube video key for the trailer or teaser, or null if not found
 */
export async function getTvShowTrailer(tvId: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.tv.trailer(tvId));
  cacheLife('hours');

  try {
    const data = await tmdbFetch<TmdbVideoResponse>(`/tv/${tvId}/videos`, {
      errorMessage: 'Failed to fetch trailer',
    });

    const trailer = data.results.find(
      (video) => (video.type === 'Trailer' || video.type === 'Teaser') && video.site === 'YouTube',
    );

    if (!trailer) {
      return null;
    }

    return trailer.key;
  } catch (error) {
    console.error('Error fetching trailer:', error);
    return null;
  }
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
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.tv.imdbId(tvId));
  cacheLife('hours');

  const data = await tmdbFetch<TmdbExternalIdsResponse>(`/tv/${tvId}/external_ids`, {
    errorMessage: 'Failed loading TV show IMDB ID',
  });
  return data.imdb_id;
}
