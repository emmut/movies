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
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache';
import { MAJOR_STREAMING_PROVIDERS, TMDB_API_URL } from './config';

const majorProviders = MAJOR_STREAMING_PROVIDERS.join('|');

/**
 * Fetches the list of trending movies for the current day from TMDb.
 *
 * @returns An array of trending movie results.
 * @throws If the request to TMDb fails.
 */
export async function fetchTrendingMovies() {
  'use cache';
  cacheTag('trending');
  cacheLife('minutes');

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

async function getUserRegionWithFallback() {
  try {
    return await getUserRegion();
  } catch (error) {
    // Fallback to default region if user is not logged in or error occurs
    console.warn(
      'Could not get user region, using fallback:',
      DEFAULT_REGION,
      error
    );
    return DEFAULT_REGION;
  }
}

/**
 * Retrieves the list of available movie genres from the TMDb API.
 *
 * @returns An array of genre objects.
 */
export async function fetchAvailableGenres() {
  'use cache';
  cacheTag('genres');
  cacheLife('days');

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

/**
 * Fetches movies from TMDb based on discovery criteria such as genre, page, sorting, watch providers, and region.
 *
 * @param genreId - The genre ID to filter movies by; use 0 for no genre filter
 * @param page - The page number of results to fetch (default is 1)
 * @param sortBy - Optional sorting criteria (e.g., 'popularity.desc')
 * @param watchProviders - Optional pipe-separated list of watch provider IDs
 * @param watchRegion - Optional region code for watch providers
 * @returns An object containing the array of discovered movies and the total number of result pages (capped at 500)
 * @throws Error if the fetch request fails
 */
export async function fetchDiscoverMovies(
  genreId: number,
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string
) {
  'use cache';
  cacheTag('discover');
  cacheLife('minutes');

  const url = new URL(`${TMDB_API_URL}/discover/movie`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort_by', sortBy || 'popularity.desc');
  url.searchParams.set('region', DEFAULT_REGION);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('include_video', 'false');

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
  return { movies: movies.results, totalPages };
}

/**
 * Fetches discovered movies for the user's region, filtered by genre and paginated by page number.
 *
 * Uses the user's region (with fallback) and sorts results by popularity. Returns a list of movies and the total number of pages, capped at 500.
 *
 * @param genreId - The genre ID to filter movies by; use 0 for no genre filter
 * @param page - The page number for pagination (default is 1)
 * @returns An object containing the array of discovered movies and the total number of pages (maximum 500)
 */
export async function fetchUserDiscoverMovies(
  genreId: number,
  page: number = 1
) {
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
  return { movies: movies.results, totalPages };
}

/**
 * Retrieves a list of movies currently playing in theaters.
 *
 * @returns An array of now playing movie results
 */
export async function fetchNowPlayingMovies() {
  'use cache';
  cacheTag('now-playing');
  cacheLife('minutes');

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

/**
 * Fetches upcoming movies from TMDb, excluding those that are currently playing.
 *
 * @returns An array of upcoming movies not currently in theaters.
 */
export async function fetchUpcomingMovies() {
  'use cache';
  cacheTag('upcoming');
  cacheLife('minutes');

  const [upcomingRes, nowPlayingMovies] = await Promise.all([
    fetch(`${TMDB_API_URL}/movie/upcoming`, {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
      next: {
        revalidate: 60 * 5,
      },
    }),
    fetchNowPlayingMovies(),
  ]);

  if (!upcomingRes.ok) {
    throw new Error('Failed loading upcoming movies');
  }

  const upcomingMovies: MovieResponse = await upcomingRes.json();

  const nowPlayingIds = new Set(nowPlayingMovies.map((movie) => movie.id));
  const filteredUpcomingMovies = upcomingMovies.results.filter(
    (movie) => !nowPlayingIds.has(movie.id)
  );

  return filteredUpcomingMovies;
}

/**
 * Fetches movies currently playing in theaters for the user's region, using a fallback if the region cannot be determined.
 *
 * @returns An array of movies now playing in the user's region
 */
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

/**
 * Retrieves upcoming movies for the user's region, excluding those currently playing in theaters.
 *
 * @returns An array of upcoming movies not currently in theaters for the user's region.
 *
 * @throws {Error} If the request for upcoming movies fails.
 */
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
  const filteredUpcomingMovies = upcomingMovies.results.filter(
    (movie) => !nowPlayingIds.has(movie.id)
  );

  return filteredUpcomingMovies;
}

/**
 * Fetches detailed information for a specific movie from TMDb by its ID.
 *
 * @param movieId - The TMDb movie identifier
 * @returns The detailed movie data
 *
 * @throws Error if the movie details cannot be loaded from TMDb
 */
export async function getMovieDetails(movieId: number) {
  'use cache';
  cacheTag('movie-details');
  cacheLife('minutes');

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

/**
 * Retrieves the cast and crew credits for a specific movie by its ID.
 *
 * @param movieId - The unique identifier of the movie
 * @returns The credits data including cast and crew information
 */
export async function getMovieCredits(movieId: number) {
  'use cache';
  cacheTag('movie-credits');
  cacheLife('minutes');

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

/**
 * Retrieves watch provider information for a specific movie from TMDb.
 *
 * @param movieId - The TMDb ID of the movie
 * @returns An object containing watch provider data, including the `results` field with provider details
 */
export async function getMovieWatchProviders(movieId: number) {
  'use cache';
  cacheTag('movie-watch-providers');
  cacheLife('minutes');

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

  return {
    ...watchProviders,
    results: watchProviders.results,
  };
}

/**
 * Retrieves the YouTube trailer or teaser key for a specific movie by its ID.
 *
 * Searches for a video of type "Trailer" or "Teaser" hosted on YouTube. Returns the video key if found, or null if no suitable trailer is available or if the fetch fails.
 *
 * @param movieId - The TMDb ID of the movie to fetch the trailer for
 * @returns The YouTube video key for the trailer or teaser, or null if not found
 */
export async function getMovieTrailer(movieId: number) {
  'use cache';
  cacheTag(`movie-trailer-${movieId}`);
  cacheLife('hours');

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

export async function getMovieRecommendations(
  movieId: number,
  userRegion?: string
) {
  'use cache';
  cacheTag(`movie-recommendations-${movieId}`);
  cacheLife('hours');

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

export async function getMovieSimilar(movieId: number, userRegion?: string) {
  'use cache';
  cacheTag(`movie-similar-${movieId}`);
  cacheLife('hours');

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
