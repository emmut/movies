import 'server-only';
import type { GenreResponse } from '@movies/api/tmdb-types/genre';
import {
  MovieCredits,
  MovieDetails,
  MovieRecommendations,
  MovieSimilar,
  MovieWatchProviders,
} from '@movies/api/tmdb-types/movie';
import { cacheLife, cacheTag } from 'next/cache';

import { CACHE_TAGS } from './cache-tags';
import { tmdbFetch } from './tmdb';

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
  // Near-static data, fanned out once per row on list pages — keep it warm.
  cacheLife('hours');

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
