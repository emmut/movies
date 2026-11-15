import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';

import { createServerApi } from '@/lib/api-server';

import { CACHE_TAGS } from './cache-tags';

/**
 * Retrieves the list of available movie genres from the TMDb API.
 *
 * @returns An array of genre objects.
 */
export async function fetchAvailableGenres() {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.genres.movies);
  cacheLife('biweekly');

  return createServerApi(new Headers()).discovery.genres({ type: 'movie' });
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

  return createServerApi(new Headers()).catalog.movieDetails({ id: movieId });
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

  return createServerApi(new Headers()).catalog.movieCredits({ id: movieId });
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

  return createServerApi(new Headers()).catalog.availability({ type: 'movie', id: movieId });
}

export async function getMovieRecommendations(movieId: number, userRegion?: string) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.movie.recommendations(movieId));
  cacheLife('hours');

  return createServerApi(new Headers()).catalog.related({
    type: 'movie',
    id: movieId,
    region: userRegion,
    kind: 'recommendations',
  });
}

export async function getMovieSimilar(movieId: number, userRegion?: string) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.movie.similar(movieId));
  cacheLife('hours');

  return createServerApi(new Headers()).catalog.related({
    type: 'movie',
    id: movieId,
    region: userRegion,
    kind: 'similar',
  });
}
