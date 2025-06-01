import { env } from '@/env';
import type { MovieResponse } from '@/types/Movie';
import { unstable_cacheLife as cacheLife } from 'next/cache';

export async function fetchTrendingMovies() {
  'use cache';
  cacheLife('minutes');

  const res = await fetch('https://api.themoviedb.org/3/trending/movie/day', {
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
