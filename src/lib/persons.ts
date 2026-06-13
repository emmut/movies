import { cacheLife, cacheTag } from 'next/cache';

import { PersonDetails, PersonMovieCredits, PersonTvCredits } from '@/types/person';

import { CACHE_TAGS } from './cache-tags';
import { tmdbFetch } from './tmdb';

/**
 * Fetches detailed information for an person from TMDb by their ID.
 *
 * @param personId - The TMDb ID of the person.
 * @returns The person's detailed information.
 *
 * @throws If the person details cannot be loaded from the API.
 */
export async function getPersonDetails(personId: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.person.details(personId));
  cacheLife('minutes');

  return await tmdbFetch<PersonDetails>(`/person/${personId}`, {
    errorMessage: 'Failed loading person details',
  });
}

/**
 * Fetches movie credits for an person by their TMDb ID.
 *
 * @param personId - The TMDb ID of the person.
 * @returns The movie credits for the specified person.
 *
 * @throws {Error} If the movie credits cannot be loaded from TMDb.
 */
export async function getPersonMovieCredits(personId: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.person.movieCredits(personId));
  cacheLife('minutes');

  return await tmdbFetch<PersonMovieCredits>(`/person/${personId}/movie_credits`, {
    errorMessage: 'Failed loading person movie credits',
  });
}

/**
 * Fetches TV show credits for an person by their TMDb ID.
 *
 * @param personId - The TMDb ID of the person.
 * @returns The TV show credits for the specified person.
 *
 * @throws {Error} If the TV show credits cannot be loaded from TMDb.
 */
export async function getPersonTvCredits(personId: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.person.tvCredits(personId));
  cacheLife('minutes');

  return await tmdbFetch<PersonTvCredits>(`/person/${personId}/tv_credits`, {
    errorMessage: 'Failed loading person TV credits',
  });
}
