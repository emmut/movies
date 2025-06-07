import { env } from '@/env';
import { TvCredits, TvDetails } from '@/types/TvShow';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache';

export async function getTvShowDetails(resourceId: number) {
  'use cache';
  cacheTag('movie-details');
  cacheLife('minutes');

  const res = await fetch(`https://api.themoviedb.org/3/tv/${resourceId}`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading movie details');
  }

  const tvShow: TvDetails = await res.json();

  return tvShow;
}

export async function getTvShowCredits(resourceId: number) {
  'use cache';
  cacheTag('tv-credits');
  cacheLife('minutes');

  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${resourceId}/credits`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed loading tv credits');
  }

  const tvCredits: TvCredits = await res.json();

  return tvCredits;
}
