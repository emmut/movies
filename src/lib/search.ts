import { env } from '@/env';
import {
  Movie,
  MultiSearchResponse,
  SearchedMovieResponse,
} from '@/types/movie';
import { SearchedPerson, SearchedPersonResponse } from '@/types/person';
import { SearchedTvResponse, TvShow } from '@/types/tv-show';

export async function fetchMoviesBySearchQuery(query: string, page: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('query', query);
  searchParams.set('page', page);
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

export async function fetchPersonsBySearchQuery(query: string, page: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('query', query);
  searchParams.set('page', page);
  searchParams.set('include_adult', 'false');

  const res = await fetch(
    `https://api.themoviedb.org/3/search/person?${searchParams.toString()}`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        cache: 'no-store',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed fetching searched persons');
  }

  const persons: SearchedPersonResponse = await res.json();
  return { persons: persons.results, totalPages: persons.total_pages };
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

  const results: MultiSearchResponse = await res.json();
  return { results: results.results, totalPages: results.total_pages };
}

export type SearchMoviesResult = {
  movies: Movie[];
  totalPages: number;
};

export type SearchTvShowsResult = {
  tvShows: TvShow[];
  totalPages: number;
};

export type SearchPersonsResult = {
  persons: SearchedPerson[];
  totalPages: number;
};

export type SearchMultiResult = {
  results: MultiSearchResponse['results'];
  totalPages: number;
};

export type SearchResult =
  | SearchMoviesResult
  | SearchTvShowsResult
  | SearchPersonsResult
  | SearchMultiResult;

/**
 * Type guard to check if a SearchResult is a SearchMoviesResult.
 */
export function isSearchMoviesResult(
  result: SearchResult
): result is SearchMoviesResult {
  return 'movies' in result;
}

/**
 * Type guard to check if a SearchResult is a SearchTvShowsResult.
 */
export function isSearchTvShowsResult(
  result: SearchResult
): result is SearchTvShowsResult {
  return 'tvShows' in result;
}

/**
 * Type guard to check if a SearchResult is a SearchPersonsResult.
 */
export function isSearchPersonsResult(
  result: SearchResult
): result is SearchPersonsResult {
  return 'persons' in result;
}

/**
 * Type guard to check if a SearchResult is a SearchMultiResult.
 */
export function isSearchMultiResult(
  result: SearchResult
): result is SearchMultiResult {
  return 'results' in result;
}

/**
 * Fetches search movies data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing movies array and total pages
 */
export async function getSearchMovies(
  query: string,
  page: number = 1
): Promise<SearchMoviesResult> {
  const { movies, totalPages } = await fetchMoviesBySearchQuery(
    query,
    String(page)
  );
  return { movies, totalPages };
}

/**
 * Fetches search TV shows data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing TV shows array and total pages
 */
export async function getSearchTvShows(
  query: string,
  page: number = 1
): Promise<SearchTvShowsResult> {
  const { tvShows, totalPages } = await fetchTvShowsBySearchQuery(
    query,
    String(page)
  );
  return { tvShows, totalPages };
}

/**
 * Fetches search persons data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing persons array and total pages
 */
export async function getSearchPersons(
  query: string,
  page: number = 1
): Promise<SearchPersonsResult> {
  const { persons, totalPages } = await fetchPersonsBySearchQuery(
    query,
    String(page)
  );
  return { persons, totalPages };
}

/**
 * Fetches multi search data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing mixed results array and total pages
 */
export async function getSearchMulti(
  query: string,
  page: number = 1
): Promise<SearchMultiResult> {
  const { results, totalPages } = await fetchMultiSearchQuery(
    query,
    String(page)
  );
  return { results, totalPages };
}
