import { env } from '@/env';
import {
  PersonDetails,
  PersonMovieCredits,
  PersonTvCredits,
} from '@/types/person';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache';
import { TMDB_API_URL } from './config';

/**
 * Fetches detailed information for an person from TMDb by their ID.
 *
 * @param personId - The TMDb ID of the person.
 * @returns The person's detailed information.
 *
 * @throws If the person details cannot be loaded from the API.
 */
export async function getPersonDetails(personId: number) {
  'use cache';
  cacheTag('person-details');
  cacheLife('minutes');

  const res = await fetch(`${TMDB_API_URL}/person/${personId}`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading person details');
  }

  const person: PersonDetails = await res.json();
  return person;
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
  'use cache';
  cacheTag('person-movie-credits');
  cacheLife('minutes');

  const res = await fetch(`${TMDB_API_URL}/person/${personId}/movie_credits`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading person movie credits');
  }

  const credits: PersonMovieCredits = await res.json();
  return credits;
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
  'use cache';
  cacheTag('person-tv-credits');
  cacheLife('minutes');

  const res = await fetch(`${TMDB_API_URL}/person/${personId}/tv_credits`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading person TV credits');
  }

  const credits: PersonTvCredits = await res.json();
  return credits;
}
