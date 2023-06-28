import { env } from 'process';
import type { GenreResponse } from '@/types/Genre';

export async function fetchAvailableGenres() {
  const res = await fetch('https://api.themoviedb.org/3/genre/movie/list', {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
    next: {
      revalidate: 60 * 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading genres');
  }

  const movies: GenreResponse = await res.json();
  return movies.genres;
}
