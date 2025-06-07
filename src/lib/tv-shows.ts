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

async function getUserRegionWithFallback(): Promise<string> {
  try {
    return await getUserRegion();
  } catch (error) {
    console.warn('Failed to get user region:', error);
    return DEFAULT_REGION;
  }
}

export async function getTvShowDetails(resourceId: number) {
  'use cache';
  cacheTag('movie-details');
  cacheLife('minutes');

  const res = await fetch(`https://api.themoviedb.org/3/tv/${resourceId}`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading movie details');
  }

  const tvShow: TvDetails = await res.json();

  return tvShow;
}

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
