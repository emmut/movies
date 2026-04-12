import { env } from '@/env';
import { DEFAULT_REGION } from '@/lib/regions';
import { getUserRegion } from '@/lib/user-actions';
import type { GenreResponse } from '@/types/genre';
import {
  MovieCredits,
  MovieDetails,
  MovieRecommendations,
  MovieResponse,
  MovieSimilar,
  MovieWatchProviders,
} from '@/types/movie';
import { TmdbVideoResponse } from '@/types/tmdb-video';

import { CACHE_TAGS } from './cache-tags';
import { MAJOR_STREAMING_PROVIDERS } from './config';
import { buildProxyImageUrls } from './imgproxy-url';
import { MIN_RUNTIME_FILTER_MINUTES, TMDB_API_URL } from './constants';
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
    console.warn('Could not get user region, using fallback:', DEFAULT_REGION, error);
    return DEFAULT_REGION;
  }
}

async function _fetchTrendingMovies() {
  const res = await fetch(`${TMDB_API_URL}/trending/movie/day`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading trending movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export const fetchTrendingMovies = withCache(
  _fetchTrendingMovies,
  () => CACHE_TAGS.public.home.trendingMovies,
  TTL.minutes,
);

async function _fetchAvailableGenres() {
  const res = await fetch(`${TMDB_API_URL}/genre/movie/list`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading genres');
  }

  const movies: GenreResponse = await res.json();
  return movies.genres;
}

export const fetchAvailableGenres = withCache(
  _fetchAvailableGenres,
  () => CACHE_TAGS.public.genres.movies,
  TTL.biweekly,
);

export async function fetchDiscoverMovies(
  genreId: number,
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string,
  withRuntimeLte?: number,
) {
  const cacheKey = `${CACHE_TAGS.public.discover.movies}:${genreId}:${page}:${sortBy}:${watchProviders}:${watchRegion}:${withRuntimeLte}`;

  return withCache(
    async () => {
      const url = new URL(`${TMDB_API_URL}/discover/movie`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('sort_by', sortBy || 'popularity.desc');
      url.searchParams.set('region', DEFAULT_REGION);
      url.searchParams.set('include_adult', 'false');
      url.searchParams.set('include_video', 'false');

      if (genreId !== 0) {
        url.searchParams.set('with_genres', String(genreId));
      }

      if (watchProviders !== undefined && watchRegion !== undefined) {
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
        throw new Error('Error loading discover movies');
      }

      const movies: MovieResponse = await res.json();
      const totalPages = movies.total_pages >= 500 ? 500 : movies.total_pages;
      return { movies: movies.results.map(addPosterImageUrls), totalPages };
    },
    () => cacheKey,
    TTL.minutes,
  )();
}

export async function fetchUserDiscoverMovies(genreId: number, page: number = 1) {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL(`${TMDB_API_URL}/discover/movie`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort_by', 'popularity.desc');
  url.searchParams.set('region', userRegion);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('include_video', 'false');

  if (genreId !== 0) {
    url.searchParams.set('with_genres', String(genreId));
  }

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading discover movies');
  }

  const movies: MovieResponse = await res.json();
  const totalPages = movies.total_pages >= 500 ? 500 : movies.total_pages;
  return { movies: movies.results.map(addPosterImageUrls), totalPages };
}

async function _fetchNowPlayingMovies() {
  const res = await fetch(`${TMDB_API_URL}/movie/now_playing`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading now playing movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export const fetchNowPlayingMovies = withCache(
  _fetchNowPlayingMovies,
  () => CACHE_TAGS.public.home.nowPlayingMovies,
  TTL.minutes,
);

async function _fetchUpcomingMovies() {
  const [upcomingRes, nowPlayingMovies] = await Promise.all([
    fetch(`${TMDB_API_URL}/movie/upcoming`, {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
    }),
    fetchNowPlayingMovies(),
  ]);

  if (!upcomingRes.ok) {
    throw new Error('Failed loading upcoming movies');
  }

  const upcomingMovies: MovieResponse = await upcomingRes.json();

  const nowPlayingIds = new Set(nowPlayingMovies.map((movie) => movie.id));
  return upcomingMovies.results.filter((movie) => !nowPlayingIds.has(movie.id));
}

export const fetchUpcomingMovies = withCache(
  _fetchUpcomingMovies,
  () => CACHE_TAGS.public.home.upcomingMovies,
  TTL.minutes,
);

export async function fetchUserNowPlayingMovies() {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL(`${TMDB_API_URL}/movie/now_playing`);
  url.searchParams.set('region', userRegion);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading now playing movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export async function fetchUserUpcomingMovies() {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL(`${TMDB_API_URL}/movie/upcoming`);
  url.searchParams.set('region', userRegion);

  const [upcomingRes, nowPlayingMovies] = await Promise.all([
    fetch(url, {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
    }),
    fetchUserNowPlayingMovies(),
  ]);

  if (!upcomingRes.ok) {
    throw new Error('Failed loading upcoming movies');
  }

  const upcomingMovies: MovieResponse = await upcomingRes.json();

  const nowPlayingIds = new Set(nowPlayingMovies.map((movie) => movie.id));
  return upcomingMovies.results.filter((movie) => !nowPlayingIds.has(movie.id));
}

async function _fetchTopRatedMovies() {
  const url = new URL(`${TMDB_API_URL}/movie/top_rated`);
  url.searchParams.set('region', DEFAULT_REGION);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading top rated movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

export const fetchTopRatedMovies = withCache(
  _fetchTopRatedMovies,
  () => CACHE_TAGS.public.home.topRatedMovies,
  TTL.minutes,
);

export async function fetchUserTopRatedMovies() {
  const userRegion = await getUserRegionWithFallback();

  const url = new URL(`${TMDB_API_URL}/movie/top_rated`);
  url.searchParams.set('region', userRegion);

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading top rated movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}

async function _getMovieDetails(movieId: number) {
  const res = await fetch(`${TMDB_API_URL}/movie/${movieId}`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading movie details');
  }

  const movie: MovieDetails = await res.json();
  return movie;
}

export const getMovieDetails = withCache(
  _getMovieDetails,
  (movieId) => CACHE_TAGS.public.movie.details(movieId),
  TTL.minutes,
);

async function _getMovieCredits(movieId: number) {
  const res = await fetch(`${TMDB_API_URL}/movie/${movieId}/credits`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading movie credits');
  }

  const credits: MovieCredits = await res.json();
  return credits;
}

export const getMovieCredits = withCache(
  _getMovieCredits,
  (movieId) => CACHE_TAGS.public.movie.credits(movieId),
  TTL.minutes,
);

async function _getMovieWatchProviders(movieId: number) {
  const res = await fetch(`${TMDB_API_URL}/movie/${movieId}/watch/providers`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading movie watch providers');
  }

  const watchProviders: MovieWatchProviders = await res.json();
  return { results: watchProviders.results };
}

export const getMovieWatchProviders = withCache(
  _getMovieWatchProviders,
  (movieId) => CACHE_TAGS.public.movie.watchProviders(movieId),
  TTL.days,
);

async function _getMovieTrailer(movieId: number) {
  try {
    const response = await fetch(`${TMDB_API_URL}/movie/${movieId}/videos`, {
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

export const getMovieTrailer = withCache(
  _getMovieTrailer,
  (movieId) => CACHE_TAGS.public.movie.trailer(movieId),
  TTL.hours,
);

async function _getMovieRecommendations(movieId: number, userRegion?: string) {
  const url = new URL(`${TMDB_API_URL}/movie/${movieId}/recommendations`);

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
    throw new Error('Failed loading movie recommendations');
  }

  const recommendations: MovieRecommendations = await res.json();
  return recommendations.results;
}

export const getMovieRecommendations = withCache(
  _getMovieRecommendations,
  (movieId, userRegion) => `${CACHE_TAGS.public.movie.recommendations(movieId)}:${userRegion}`,
  TTL.hours,
);

async function _getMovieSimilar(movieId: number, userRegion?: string) {
  const url = new URL(`${TMDB_API_URL}/movie/${movieId}/similar`);

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
    throw new Error('Failed loading movie similar');
  }

  const similar: MovieSimilar = await res.json();
  return similar.results;
}

export const getMovieSimilar = withCache(
  _getMovieSimilar,
  (movieId, userRegion) => `${CACHE_TAGS.public.movie.similar(movieId)}:${userRegion}`,
  TTL.hours,
);
