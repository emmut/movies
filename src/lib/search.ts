import { SearchedMovieResponse } from '@/types/Movie';
import { env } from 'process';

export async function fetchMoviesBySearchQuery(query: string, page: string) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${query}&page=${page}&sort_by=popularity.desc&include_adult=false&include_video=false`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        cache: 'no-store',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed fetching searched movies');
  }

  const movies: SearchedMovieResponse = await res.json();
  return movies;
}
