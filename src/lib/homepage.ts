import { env } from 'process';
import type { MovieResponse } from '@/types/Movie';

export async function fetchTrendingMovies() {
  const res = await fetch('https://api.themoviedb.org/3/trending/movie/day', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
    next: {
      revalidate: 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading trending movies');
  }

  const movies: MovieResponse = await res.json();
  return movies.results;
}
