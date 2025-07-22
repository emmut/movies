import { env } from '@/env';
import { ActorDetails, ActorMovieCredits, ActorTvCredits } from '@/types/actor';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache';
import { TMDB_API_URL } from './config';

/**
 * Fetches detailed information for an actor from TMDb by their ID.
 *
 * @param actorId - The TMDb ID of the actor.
 * @returns The actor's detailed information.
 *
 * @throws If the actor details cannot be loaded from the API.
 */
export async function getActorDetails(actorId: number) {
  'use cache';
  cacheTag('actor-details');
  cacheLife('minutes');

  const res = await fetch(`${TMDB_API_URL}/person/${actorId}`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading actor details');
  }

  const actor: ActorDetails = await res.json();
  return actor;
}

/**
 * Fetches movie credits for an actor by their TMDb ID.
 *
 * @param actorId - The TMDb ID of the actor.
 * @returns The movie credits for the specified actor.
 *
 * @throws {Error} If the movie credits cannot be loaded from TMDb.
 */
export async function getActorMovieCredits(actorId: number) {
  'use cache';
  cacheTag('actor-movie-credits');
  cacheLife('minutes');

  const res = await fetch(`${TMDB_API_URL}/person/${actorId}/movie_credits`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading actor movie credits');
  }

  const credits: ActorMovieCredits = await res.json();
  return credits;
}

/**
 * Fetches TV show credits for an actor by their TMDb ID.
 *
 * @param actorId - The TMDb ID of the actor.
 * @returns The TV show credits for the specified actor.
 *
 * @throws {Error} If the TV show credits cannot be loaded from TMDb.
 */
export async function getActorTvCredits(actorId: number) {
  'use cache';
  cacheTag('actor-tv-credits');
  cacheLife('minutes');

  const res = await fetch(`${TMDB_API_URL}/person/${actorId}/tv_credits`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading actor TV credits');
  }

  const credits: ActorTvCredits = await res.json();
  return credits;
}
