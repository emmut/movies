'use server';

import { cacheLife, cacheTag } from 'next/cache';

import { DEFAULT_REGION } from '@/lib/regions';
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
import { MIN_RUNTIME_FILTER_MINUTES } from './constants';
import { addPosterImageUrls, tmdbFetch } from './tmdb';
import { getUserRegionWithFallback } from './user-region';

const majorProviders = MAJOR_STREAMING_PROVIDERS.join('|');

/**
 * Fetches the list of trending movies for the current day from TMDb.
 *
 * @returns An array of trending movie results.
 * @throws If the request to TMDb fails.
 */
export async function fetchTrendingMovies() {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.home.trendingMovies);
  cacheLife('minutes');

  const movies = await tmdbFetch<MovieResponse>('/trending/movie/day', {
    errorMessage: 'Failed loading trending movies',
  });
  return movies.results;
}

/**
 * Retrieves the list of available movie genres from the TMDb API.
 *
 * @returns An array of genre objects.
 */
export async function fetchAvailableGenres() {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.genres.movies);
  cacheLife('biweekly');

  const movies = await tmdbFetch<GenreResponse>('/genre/movie/list', {
    errorMessage: 'Error loading genres',
  });
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
 * @param withRuntimeLte - Optional maximum runtime filter (less than or equal to)
 * @returns An object containing the array of discovered movies and the total number of result pages (capped at 500)
 * @throws Error if the fetch request fails
 */
export async function fetchDiscoverMovies(
  genreId: number,
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string,
  withRuntimeLte?: number,
) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.discover.movies);
  cacheLife('minutes');

  const hasWatchProviderFilter = watchProviders !== undefined && watchRegion !== undefined;
  const hasRuntimeFilter = typeof withRuntimeLte === 'number' && withRuntimeLte > 0;

  const movies = await tmdbFetch<MovieResponse>('/discover/movie', {
    searchParams: {
      page,
      sort_by: sortBy || 'popularity.desc',
      region: DEFAULT_REGION,
      include_adult: 'false',
      include_video: 'false',
      with_genres: genreId !== 0 ? genreId : undefined,
      with_watch_providers: hasWatchProviderFilter ? watchProviders : majorProviders,
      watch_region: hasWatchProviderFilter ? watchRegion : watchRegion || DEFAULT_REGION,
      'with_runtime.lte': hasRuntimeFilter ? withRuntimeLte : undefined,
      'with_runtime.gte': hasRuntimeFilter ? MIN_RUNTIME_FILTER_MINUTES : undefined,
    },
    errorMessage: 'Error loading discover movies',
  });

  const totalPages = movies.total_pages >= 500 ? 500 : movies.total_pages;
  return { movies: movies.results.map(addPosterImageUrls), totalPages };
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
export async function fetchUserDiscoverMovies(genreId: number, page: number = 1) {
  const userRegion = await getUserRegionWithFallback();

  const movies = await tmdbFetch<MovieResponse>('/discover/movie', {
    searchParams: {
      page,
      sort_by: 'popularity.desc',
      region: userRegion,
      include_adult: 'false',
      include_video: 'false',
      with_genres: genreId !== 0 ? genreId : undefined,
    },
    errorMessage: 'Error loading discover movies',
  });

  const totalPages = movies.total_pages >= 500 ? 500 : movies.total_pages;
  return { movies: movies.results.map(addPosterImageUrls), totalPages };
}

/**
 * Retrieves a list of movies currently playing in theaters.
 *
 * @returns An array of now playing movie results
 */
export async function fetchNowPlayingMovies() {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.home.nowPlayingMovies);
  cacheLife('minutes');

  const movies = await tmdbFetch<MovieResponse>('/movie/now_playing', {
    errorMessage: 'Failed loading now playing movies',
  });
  return movies.results;
}

/**
 * Fetches upcoming movies from TMDb, excluding those that are currently playing.
 *
 * @returns An array of upcoming movies not currently in theaters.
 */
export async function fetchUpcomingMovies() {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.home.upcomingMovies);
  cacheLife('minutes');

  const [upcomingMovies, nowPlayingMovies] = await Promise.all([
    tmdbFetch<MovieResponse>('/movie/upcoming', {
      errorMessage: 'Failed loading upcoming movies',
    }),
    fetchNowPlayingMovies(),
  ]);

  const nowPlayingIds = new Set(nowPlayingMovies.map((movie) => movie.id));
  const filteredUpcomingMovies = upcomingMovies.results.filter(
    (movie) => !nowPlayingIds.has(movie.id),
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

  const movies = await tmdbFetch<MovieResponse>('/movie/now_playing', {
    searchParams: { region: userRegion },
    errorMessage: 'Failed loading now playing movies',
  });
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

  const [upcomingMovies, nowPlayingMovies] = await Promise.all([
    tmdbFetch<MovieResponse>('/movie/upcoming', {
      searchParams: { region: userRegion },
      errorMessage: 'Failed loading upcoming movies',
    }),
    fetchUserNowPlayingMovies(),
  ]);

  const nowPlayingIds = new Set(nowPlayingMovies.map((movie) => movie.id));
  const filteredUpcomingMovies = upcomingMovies.results.filter(
    (movie) => !nowPlayingIds.has(movie.id),
  );

  return filteredUpcomingMovies;
}

/**
 * Retrieves a list of top-rated movies from the Movie Database API for the SE region.
 *
 * Filters out adult content and videos, sorts results by highest vote average, and returns the resulting movie array.
 *
 * @returns An array of top-rated movie objects.
 *
 * @throws {Error} If the API request fails or returns a non-successful response.
 */
export async function fetchTopRatedMovies() {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.home.topRatedMovies);
  cacheLife('minutes');

  const movies = await tmdbFetch<MovieResponse>('/movie/top_rated', {
    searchParams: { region: DEFAULT_REGION },
    errorMessage: 'Failed loading top rated movies',
  });
  return movies.results;
}

/**
 * Fetches top-rated movies for the user's region, using a fallback if the region cannot be determined.
 *
 * @returns An array of top-rated movies for the user's region.
 *
 * @throws {Error} If the request to fetch top-rated movies fails.
 */
export async function fetchUserTopRatedMovies() {
  const userRegion = await getUserRegionWithFallback();

  const movies = await tmdbFetch<MovieResponse>('/movie/top_rated', {
    searchParams: { region: userRegion },
    errorMessage: 'Failed loading top rated movies',
  });
  return movies.results;
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
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.movie.details(movieId));
  cacheLife('minutes');

  return await tmdbFetch<MovieDetails>(`/movie/${movieId}`, {
    errorMessage: 'Failed loading movie details',
  });
}

/**
 * Retrieves the cast and crew credits for a specific movie by its ID.
 *
 * @param movieId - The unique identifier of the movie
 * @returns The credits data including cast and crew information
 */
export async function getMovieCredits(movieId: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.movie.credits(movieId));
  cacheLife('minutes');

  return await tmdbFetch<MovieCredits>(`/movie/${movieId}/credits`, {
    errorMessage: 'Failed loading movie credits',
  });
}

/**
 * Retrieves watch provider information for a specific movie from TMDb.
 *
 * @param movieId - The TMDb ID of the movie
 * @returns An object containing watch provider data, including the `results` field with provider details
 */
export async function getMovieWatchProviders(movieId: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.movie.watchProviders(movieId));
  cacheLife('days');

  const watchProviders = await tmdbFetch<MovieWatchProviders>(`/movie/${movieId}/watch/providers`, {
    errorMessage: 'Failed loading movie watch providers',
  });

  return {
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
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.movie.trailer(movieId));
  cacheLife('hours');

  try {
    const data = await tmdbFetch<TmdbVideoResponse>(`/movie/${movieId}/videos`, {
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

export async function getMovieRecommendations(movieId: number, userRegion?: string) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.movie.recommendations(movieId));
  cacheLife('hours');

  const recommendations = await tmdbFetch<MovieRecommendations>(
    `/movie/${movieId}/recommendations`,
    {
      searchParams: { region: userRegion },
      errorMessage: 'Failed loading movie recommendations',
    },
  );
  return recommendations.results;
}

export async function getMovieSimilar(movieId: number, userRegion?: string) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.movie.similar(movieId));
  cacheLife('hours');

  const similar = await tmdbFetch<MovieSimilar>(`/movie/${movieId}/similar`, {
    searchParams: { region: userRegion },
    errorMessage: 'Failed loading movie similar',
  });
  return similar.results;
}
