import { env } from '@/env';
import type { GenreResponse } from '@/types/Genre';
import {
  TvCredits,
  TvDetails,
  TvResponse,
  TvWatchProviders,
} from '@/types/TvShow';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache';
import { getUserRegion } from './user-actions';

const DEFAULT_REGION = 'US';

/**
 * Retrieves the user's region, returning a default region if retrieval fails.
 *
 * @returns The user's region code, or the default region code if an error occurs.
 */
async function getUserRegionWithFallback(): Promise<string> {
  try {
    return await getUserRegion();
  } catch (error) {
    console.warn('Failed to get user region:', error);
    return DEFAULT_REGION;
  }
}

/**
 * Retrieves detailed information for a TV show by its TMDb ID.
 *
 * @param resourceId - The TMDb ID of the TV show.
 * @returns The detailed information for the specified TV show.
 *
 * @throws {Error} If the TV show details cannot be loaded from the API.
 */
export async function getTvShowDetails(resourceId: number) {
  'use cache';
  cacheTag('tv-details');
  cacheLife('minutes');

  const res = await fetch(`https://api.themoviedb.org/3/tv/${resourceId}`, {
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
 * Retrieves the cast and crew credits for a TV show by its ID from TMDb.
 *
 * @param resourceId - The unique identifier of the TV show.
 * @returns The credits information, including cast and crew, for the specified TV show.
 *
 * @throws {Error} If the TV show credits cannot be loaded from TMDb.
 */
export async function getTvShowCredits(resourceId: number) {
  'use cache';
  cacheTag('tv-credits');
  cacheLife('minutes');

  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${resourceId}/credits`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed loading tv credits');
  }

  const tvCredits: TvCredits = await res.json();

  return tvCredits;
}

/**
 * Retrieves watch provider information for a TV show by its ID.
 *
 * @param tvId - The TMDb ID of the TV show.
 * @returns An object containing watch provider data and its results for the specified TV show.
 *
 * @throws {Error} If the watch provider data cannot be loaded from the API.
 */
export async function getTvShowWatchProviders(tvId: number) {
  'use cache';
  cacheTag('tv-watch-providers');
  cacheLife('minutes');

  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${tvId}/watch/providers`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed loading tv watch providers');
  }

  const watchProviders: TvWatchProviders = await res.json();

  return {
    ...watchProviders,
    results: watchProviders.results,
  };
}

/**
 * Fetches a paginated list of TV shows by genre, sorted by popularity, for the default region.
 *
 * @param genreId - The genre ID to filter TV shows by. Use 0 to include all genres.
 * @param page - The page number to retrieve (default is 1).
 * @returns An object containing the list of TV shows and the total number of pages (capped at 500).
 *
 * @throws {Error} If the TV show discovery data cannot be loaded from the API.
 */
export async function fetchDiscoverTvShows(genreId: number, page: number = 1) {
  'use cache';
  cacheTag('discover');
  cacheLife('minutes');

  const url = new URL('https://api.themoviedb.org/3/discover/tv');
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort_by', 'popularity.desc');
  url.searchParams.set('region', DEFAULT_REGION);
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
 * Retrieves a paginated list of TV shows discovered by genre and sorted by popularity for the user's region.
 *
 * @param genreId - The genre ID to filter TV shows by. If 0, no genre filter is applied.
 * @param page - The page number to retrieve (default is 1).
 * @returns An object containing the list of discovered TV shows and the total number of pages (capped at 500).
 *
 * @throws {Error} If the TV show discovery request fails.
 */
export async function fetchUserDiscoverTvShows(
  genreId: number,
  page: number = 1
) {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL('https://api.themoviedb.org/3/discover/tv');
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
 * Retrieves the list of trending TV shows for the current day from TMDb.
 *
 * @returns An array of trending TV shows.
 *
 * @throws {Error} If the trending TV shows cannot be loaded from the API.
 */
export async function fetchTrendingTvShows() {
  'use cache';
  cacheTag('trending-tv');
  cacheLife('minutes');

  const res = await fetch('https://api.themoviedb.org/3/trending/tv/day', {
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
 * Retrieves a list of top-rated TV shows for the default region.
 *
 * @returns An array of top-rated TV shows.
 *
 * @throws {Error} If the request to fetch top-rated TV shows fails.
 */
export async function fetchTopRatedTvShows() {
  'use cache';
  cacheTag('top-rated-tv');
  cacheLife('minutes');

  const url = new URL('https://api.themoviedb.org/3/tv/top_rated');
  url.searchParams.set('region', DEFAULT_REGION);
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
 * Retrieves the top-rated TV shows for the user's region.
 *
 * @returns An array of top-rated TV shows for the resolved user region.
 *
 * @throws {Error} If the request to fetch top-rated TV shows fails.
 */
export async function fetchUserTopRatedTvShows() {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL('https://api.themoviedb.org/3/tv/top_rated');
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
 * Retrieves a list of TV shows that are currently on the air in the default region.
 *
 * @returns An array of TV show objects currently airing in the default region.
 *
 * @throws {Error} If the request to fetch on-the-air TV shows fails.
 */
export async function fetchOnTheAirTvShows() {
  'use cache';
  cacheTag('on-the-air-tv');
  cacheLife('minutes');

  const url = new URL('https://api.themoviedb.org/3/tv/on_the_air');
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
 * Retrieves a list of TV shows currently on the air for the user's region.
 *
 * @returns An array of TV shows currently airing in the user's region.
 *
 * @throws {Error} If the request to fetch on-the-air TV shows fails.
 */
export async function fetchUserOnTheAirTvShows() {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL('https://api.themoviedb.org/3/tv/on_the_air');
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
 * Retrieves a list of popular TV shows for the default region.
 *
 * @returns An array of popular TV shows.
 *
 * @throws {Error} If the request to fetch popular TV shows fails.
 */
export async function fetchPopularTvShows() {
  'use cache';
  cacheTag('popular-tv');
  cacheLife('minutes');

  const url = new URL('https://api.themoviedb.org/3/tv/popular');
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
 * Retrieves a list of popular TV shows for the user's region.
 *
 * @returns An array of popular TV shows for the determined user region.
 *
 * @throws {Error} If the request to fetch popular TV shows fails.
 */
export async function fetchUserPopularTvShows() {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL('https://api.themoviedb.org/3/tv/popular');
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
 * Retrieves the list of available TV genres from The Movie Database (TMDb).
 *
 * @returns An array of TV genre objects.
 *
 * @throws {Error} If the TV genres cannot be loaded from TMDb.
 */
export async function fetchAvailableTvGenres() {
  'use cache';
  cacheTag('tv-genres');
  cacheLife('days');

  const res = await fetch('https://api.themoviedb.org/3/genre/tv/list', {
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
