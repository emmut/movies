import { env } from '@/env';
import { SearchedMovieResponse } from '@/types/Movie';
import { SearchedTvResponse } from '@/types/TvShow';

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

export async function fetchTvShowsBySearchQuery(query: string, page: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('query', query);
  searchParams.set('page', page);
  searchParams.set('sort_by', 'popularity.desc');
  searchParams.set('include_adult', 'false');

  const res = await fetch(
    `https://api.themoviedb.org/3/search/tv?${searchParams.toString()}`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        cache: 'no-store',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed fetching searched TV shows');
  }

  const tvShows: SearchedTvResponse = await res.json();
  return { tvShows: tvShows.results, totalPages: tvShows.total_pages };
}

export async function fetchMultiSearchQuery(query: string, page: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('query', query);
  searchParams.set('page', page);
  searchParams.set('include_adult', 'false');

  const res = await fetch(
    `https://api.themoviedb.org/3/search/multi?${searchParams.toString()}`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        cache: 'no-store',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed fetching multi search results');
  }

  const results = await res.json();
  return { results: results.results, totalPages: results.total_pages };
}
