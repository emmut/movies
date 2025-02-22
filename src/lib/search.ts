import { SearchedMovieResponse } from '@/types/Movie';
import { env } from '@/env';

export async function fetchMoviesBySearchQuery(query: string, page: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('query', query);
  searchParams.set('page', page);
  searchParams.set('sort_by', 'popularity.desc');
  searchParams.set('include_adult', 'false');
  searchParams.set('include_video', 'false');

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?${searchParams.toString()}`,
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
  return { movies: movies.results, totalPages: movies.total_pages };
}
