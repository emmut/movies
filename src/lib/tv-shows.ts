'use server';

import { env } from '@/env';
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
import { cacheLife, cacheTag } from 'next/cache';
import { MAJOR_STREAMING_PROVIDERS } from './config';
import { MIN_RUNTIME_FILTER_MINUTES, TMDB_API_URL } from './constants';
import { DEFAULT_REGION } from './regions';
import { getUserRegion } from './user-actions';

const majorProviders = MAJOR_STREAMING_PROVIDERS.join('|');

/**
 * Retrieves the user's region, returning a default region if retrieval fails.
 *
 * @returns The user's region code, or the default region code if an error occurs.
 */
async function getUserRegionWithFallback() {
  try {
    return await getUserRegion();
  } catch (error) {
    console.warn('Failed to get user region:', error);
    return DEFAULT_REGION;
  }
}

/**
 * Fetches detailed information for a TV show from TMDb by its ID.
 *
 * @param tvId - The TMDb ID of the TV show.
 * @returns The TV show's detailed information.
 *
 * @throws If the TV show details cannot be loaded from the API.
 */
export async function getTvShowDetails(tvId: number) {
  'use cache';
  cacheTag('tv-details');
  cacheLife('minutes');

  const res = await fetch(`${TMDB_API_URL}/tv/${tvId}`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading TV show details');
  }

  const tvShow: TvDetails = await res.json();

  return tvShow;
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
  'use cache';
  cacheTag('tv-credits');
  cacheLife('minutes');

  const res = await fetch(`${TMDB_API_URL}/tv/${resourceId}/credits`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading tv credits');
  }

  const tvCredits: TvCredits = await res.json();

  return tvCredits;
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
  'use cache';
  cacheTag('tv-watch-providers');
  cacheLife('minutes');

  try {
    const res = await fetch(`${TMDB_API_URL}/tv/${tvId}/watch/providers`, {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Failed loading tv watch providers');
    }

    const watchProviders: TvWatchProviders = await res.json();

    return {
      results: watchProviders.results,
    };
  } catch (error) {
    console.error('Error fetching tv show watch providers:', error);
    throw error;
  }
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
  withRuntimeLte?: number
) {
  'use cache';
  cacheTag('discover');
  cacheLife('minutes');

  const url = new URL(`${TMDB_API_URL}/discover/tv`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort_by', sortBy || 'popularity.desc');
  url.searchParams.set('region', DEFAULT_REGION);
  url.searchParams.set('include_adult', 'false');

  if (genreId !== 0) {
    url.searchParams.set('with_genres', String(genreId));
  }

  if (watchProviders && watchRegion) {
    url.searchParams.set('with_watch_providers', watchProviders);
    url.searchParams.set('watch_region', watchRegion);
  } else {
    url.searchParams.set('with_watch_providers', majorProviders);
    url.searchParams.set('watch_region', watchRegion || DEFAULT_REGION);
  }

  if (typeof withRuntimeLte === 'number' && withRuntimeLte > 0) {
    url.searchParams.set('with_runtime.lte', String(withRuntimeLte));
    url.searchParams.set(
      'with_runtime.gte',
      String(MIN_RUNTIME_FILTER_MINUTES)
    );
  }

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading discover tv shows');
  }

  const tvShows: TvResponse = await res.json();
  const totalPages = tvShows.total_pages >= 500 ? 500 : tvShows.total_pages;
  return { tvShows: tvShows.results, totalPages };
}

/**
 * Retrieves a paginated list of TV shows filtered by genre and sorted by popularity for the user's region.
 *
 * @param genreId - The genre ID to filter TV shows by. If 0, no genre filter is applied.
 * @param page - The page number to retrieve (default is 1).
 * @returns An object containing the list of discovered TV shows and the total number of pages, capped at 500.
 *
 * @throws {Error} If the TV show discovery request fails.
 */
export async function fetchUserDiscoverTvShows(
  genreId: number,
  page: number = 1
) {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL(`${TMDB_API_URL}/discover/tv`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort_by', 'popularity.desc');
  url.searchParams.set('region', userRegion);
  url.searchParams.set('include_adult', 'false');

  if (genreId !== 0) {
    url.searchParams.set('with_genres', String(genreId));
  }

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading discover tv shows');
  }

  const tvShows: TvResponse = await res.json();
  const totalPages = tvShows.total_pages >= 500 ? 500 : tvShows.total_pages;
  return { tvShows: tvShows.results, totalPages };
}

/**
 * Fetches the list of trending TV shows for the current day from TMDb.
 *
 * @returns An array of trending TV shows for today.
 *
 * @throws If the trending TV shows cannot be loaded from the API.
 */
export async function fetchTrendingTvShows() {
  'use cache';
  cacheTag('trending-tv');
  cacheLife('minutes');

  const res = await fetch(`${TMDB_API_URL}/trending/tv/day`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading trending TV shows');
  }

  const tvShows: TvResponse = await res.json();
  return tvShows.results;
}

/**
 * Fetches the list of top-rated TV shows for the default region.
 *
 * @returns An array of top-rated TV show objects.
 *
 * @throws If the request to the TMDb API fails.
 */
export async function fetchTopRatedTvShows() {
  'use cache';
  cacheTag('top-rated-tv');
  cacheLife('minutes');

  const url = new URL(`${TMDB_API_URL}/tv/top_rated`);
  url.searchParams.set('region', DEFAULT_REGION);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading top rated TV shows');
  }

  const tvShows: TvResponse = await res.json();
  return tvShows.results;
}

/**
 * Fetches the top-rated TV shows for the user's region, using a fallback region if necessary.
 *
 * @returns An array of top-rated TV shows for the determined user region.
 *
 * @throws {Error} If the request to fetch top-rated TV shows fails.
 */
export async function fetchUserTopRatedTvShows() {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL(`${TMDB_API_URL}/tv/top_rated`);
  url.searchParams.set('region', userRegion);
  url.searchParams.set('include_adult', 'false');

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading top rated TV shows');
  }

  const tvShows: TvResponse = await res.json();
  return tvShows.results;
}

/**
 * Fetches TV shows that are currently airing in the default region.
 *
 * @returns An array of TV show objects currently on the air in the default region.
 *
 * @throws If the request to the TMDb API fails.
 */
export async function fetchOnTheAirTvShows() {
  'use cache';
  cacheTag('on-the-air-tv');
  cacheLife('minutes');

  const url = new URL(`${TMDB_API_URL}/tv/on_the_air`);
  url.searchParams.set('region', DEFAULT_REGION);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading on the air TV shows');
  }

  const tvShows: TvResponse = await res.json();
  return tvShows.results;
}

/**
 * Fetches TV shows currently airing in the user's region.
 *
 * Determines the user's region with fallback and retrieves a list of TV shows that are currently on the air for that region.
 *
 * @returns An array of TV shows currently airing in the user's region.
 *
 * @throws {Error} If the request to fetch on-the-air TV shows fails.
 */
export async function fetchUserOnTheAirTvShows() {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL(`${TMDB_API_URL}/tv/on_the_air`);
  url.searchParams.set('region', userRegion);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading on the air TV shows');
  }

  const tvShows: TvResponse = await res.json();
  return tvShows.results;
}

/**
 * Fetches a list of popular TV shows for the default region.
 *
 * @returns An array of popular TV shows.
 *
 * @throws If the request to the TMDb API fails.
 */
export async function fetchPopularTvShows() {
  'use cache';
  cacheTag('popular-tv');
  cacheLife('minutes');

  const url = new URL(`${TMDB_API_URL}/tv/popular`);
  url.searchParams.set('region', DEFAULT_REGION);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading popular TV shows');
  }

  const tvShows: TvResponse = await res.json();
  return tvShows.results;
}

/**
 * Fetches popular TV shows for the user's region, using a fallback if the region cannot be determined.
 *
 * @returns An array of popular TV shows available in the user's region.
 *
 * @throws If the request to fetch popular TV shows fails.
 */
export async function fetchUserPopularTvShows() {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL(`${TMDB_API_URL}/tv/popular`);
  url.searchParams.set('region', userRegion);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading popular TV shows');
  }

  const tvShows: TvResponse = await res.json();
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
  'use cache';
  cacheTag('tv-genres');
  cacheLife('days');

  const res = await fetch(`${TMDB_API_URL}/genre/tv/list`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading TV genres');
  }

  const tvGenres: GenreResponse = await res.json();
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
  'use cache';
  cacheTag(`tv-trailer-${tvId}`);
  cacheLife('hours');

  try {
    const response = await fetch(`${TMDB_API_URL}/tv/${tvId}/videos`, {
      headers: {
        Authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch trailer');
    }

    const data: TmdbVideoResponse = await response.json();
    const trailer = data.results.find(
      (video) =>
        (video.type === 'Trailer' || video.type === 'Teaser') &&
        video.site === 'YouTube'
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
  'use cache';
  cacheTag(`similar-tv-shows-${tvId}`);
  cacheLife('hours');

  const url = new URL(`${TMDB_API_URL}/tv/${tvId}/similar`);

  if (userRegion !== undefined) {
    url.searchParams.set('region', userRegion);
  }

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading similar TV shows');
  }

  const tvShows: TvSimilar = await res.json();
  return tvShows.results;
}

export async function getTvShowRecommendations(
  tvId: number,
  userRegion?: string
) {
  'use cache';
  cacheTag(`tv-recommendations-${tvId}`);
  cacheLife('hours');

  const url = new URL(`${TMDB_API_URL}/tv/${tvId}/recommendations`);

  if (userRegion !== undefined) {
    url.searchParams.set('region', userRegion);
  }

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading TV show recommendations');
  }

  const tvShows: TvRecommendations = await res.json();
  return tvShows.results;
}

export async function getTvShowImdbId(tvId: number) {
  'use cache';
  cacheTag(`tv-imdb-id-${tvId}`);
  cacheLife('hours');

  const url = new URL(`${TMDB_API_URL}/tv/${tvId}/external_ids`);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading TV show IMDB ID');
  }

  const data: TmdbExternalIdsResponse = await res.json();
  return data.imdb_id;
}
