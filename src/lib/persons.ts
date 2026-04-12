import { env } from '@/env';
import { PersonDetails, PersonMovieCredits, PersonTvCredits } from '@/types/person';

import { CACHE_TAGS } from './cache-tags';
import { TMDB_API_URL } from './constants';
import { withCache, TTL } from './server-cache';

async function _getPersonDetails(personId: number) {
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

export const getPersonDetails = withCache(
  _getPersonDetails,
  (personId) => CACHE_TAGS.public.person.details(personId),
  TTL.minutes,
);

async function _getPersonMovieCredits(personId: number) {
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

export const getPersonMovieCredits = withCache(
  _getPersonMovieCredits,
  (personId) => CACHE_TAGS.public.person.movieCredits(personId),
  TTL.minutes,
);

async function _getPersonTvCredits(personId: number) {
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

export const getPersonTvCredits = withCache(
  _getPersonTvCredits,
  (personId) => CACHE_TAGS.public.person.tvCredits(personId),
  TTL.minutes,
);
