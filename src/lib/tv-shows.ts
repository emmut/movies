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

import { CACHE_TAGS } from './cache-tags';
import { MAJOR_STREAMING_PROVIDERS } from './config';
import { buildProxyImageUrls } from './imgproxy-url';
import { MIN_RUNTIME_FILTER_MINUTES, TMDB_API_URL } from './constants';
import { DEFAULT_REGION } from './regions';
import { getUserRegion } from './user-actions';
import { withCache, TTL } from './server-cache';

const majorProviders = MAJOR_STREAMING_PROVIDERS.join('|');

function addPosterImageUrls<T extends { poster_path: string | null }>(item: T) {
  if (!item.poster_path) {
    return item;
  }

  return {
    ...item,
    posterImageUrls: buildProxyImageUrls(item.poster_path, {
      width: 500,
      fill: true,
    }),
  };
}

async function getUserRegionWithFallback() {
  try {
    return await getUserRegion();
  } catch (error) {
    console.warn('Failed to get user region:', error);
    return DEFAULT_REGION;
  }
}

async function _getTvShowDetails(tvId: number) {
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

export const getTvShowDetails = withCache(
  _getTvShowDetails,
  (tvId) => CACHE_TAGS.public.tv.details(tvId),
  TTL.minutes,
);

async function _getTvShowCredits(resourceId: number) {
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

export const getTvShowCredits = withCache(
  _getTvShowCredits,
  (tvId) => CACHE_TAGS.public.tv.credits(tvId),
  TTL.minutes,
);

async function _getTvShowWatchProviders(tvId: number) {
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
  return { results: watchProviders.results };
}

export const getTvShowWatchProviders = withCache(
  _getTvShowWatchProviders,
  (tvId) => CACHE_TAGS.public.tv.watchProviders(tvId),
  TTL.days,
);

export async function fetchDiscoverTvShows(
  genreId: number,
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string,
  withRuntimeLte?: number,
) {
  const cacheKey = `${CACHE_TAGS.public.discover.tv}:${genreId}:${page}:${sortBy}:${watchProviders}:${watchRegion}:${withRuntimeLte}`;

  return withCache(
    async () => {
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
        url.searchParams.set('with_runtime.gte', String(MIN_RUNTIME_FILTER_MINUTES));
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
      return { tvShows: tvShows.results.map(addPosterImageUrls), totalPages };
    },
    () => cacheKey,
    TTL.minutes,
  )();
}

export async function fetchUserDiscoverTvShows(genreId: number, page: number = 1) {
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
  return { tvShows: tvShows.results.map(addPosterImageUrls), totalPages };
}

async function _fetchTrendingTvShows() {
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

export const fetchTrendingTvShows = withCache(
  _fetchTrendingTvShows,
  () => CACHE_TAGS.public.home.trendingTv,
  TTL.minutes,
);

async function _fetchTopRatedTvShows() {
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

export const fetchTopRatedTvShows = withCache(
  _fetchTopRatedTvShows,
  () => CACHE_TAGS.public.home.topRatedTv,
  TTL.minutes,
);

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

async function _fetchOnTheAirTvShows() {
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

export const fetchOnTheAirTvShows = withCache(
  _fetchOnTheAirTvShows,
  () => CACHE_TAGS.public.home.onTheAirTv,
  TTL.minutes,
);

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

async function _fetchPopularTvShows() {
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

export const fetchPopularTvShows = withCache(
  _fetchPopularTvShows,
  () => CACHE_TAGS.public.home.popularTv,
  TTL.minutes,
);

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

async function _fetchAvailableTvGenres() {
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

export const fetchAvailableTvGenres = withCache(
  _fetchAvailableTvGenres,
  () => CACHE_TAGS.public.genres.tv,
  TTL.biweekly,
);

async function _getTvShowTrailer(tvId: number) {
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

export const getTvShowTrailer = withCache(
  _getTvShowTrailer,
  (tvId) => CACHE_TAGS.public.tv.trailer(tvId),
  TTL.hours,
);

async function _getTvShowSimilar(tvId: number, userRegion?: string) {
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

export const getTvShowSimilar = withCache(
  _getTvShowSimilar,
  (tvId, userRegion) => `${CACHE_TAGS.public.tv.similar(tvId)}:${userRegion}`,
  TTL.hours,
);

async function _getTvShowRecommendations(tvId: number, userRegion?: string) {
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

export const getTvShowRecommendations = withCache(
  _getTvShowRecommendations,
  (tvId, userRegion) => `${CACHE_TAGS.public.tv.recommendations(tvId)}:${userRegion}`,
  TTL.hours,
);

async function _getTvShowImdbId(tvId: number) {
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

export const getTvShowImdbId = withCache(
  _getTvShowImdbId,
  (tvId) => CACHE_TAGS.public.tv.imdbId(tvId),
  TTL.hours,
);
