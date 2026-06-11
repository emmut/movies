'use server';

import { Movie, MultiSearchResponse, SearchedMovieResponse } from '@/types/movie';
import { SearchedPerson, SearchedPersonResponse } from '@/types/person';
import { SearchedTvResponse, TvShow } from '@/types/tv-show';

import { addPosterImageUrls, addProfileImageUrls, tmdbFetch } from './tmdb';

async function fetchMoviesBySearchQuery(query: string, page: string) {
  const movies = await tmdbFetch<SearchedMovieResponse>('/search/movie', {
    searchParams: {
      query,
      page,
      include_adult: 'false',
      include_video: 'false',
    },
    errorMessage: 'Failed fetching searched movies',
  });
  return { movies: movies.results, totalPages: movies.total_pages };
}

async function fetchTvShowsBySearchQuery(query: string, page: string) {
  const tvShows = await tmdbFetch<SearchedTvResponse>('/search/tv', {
    searchParams: {
      query,
      page,
      include_adult: 'false',
    },
    errorMessage: 'Failed fetching searched TV shows',
  });
  return { tvShows: tvShows.results, totalPages: tvShows.total_pages };
}

async function fetchPersonsBySearchQuery(query: string, page: string) {
  const persons = await tmdbFetch<SearchedPersonResponse>('/search/person', {
    searchParams: {
      query,
      page,
      include_adult: 'false',
    },
    errorMessage: 'Failed fetching searched persons',
  });
  return { persons: persons.results, totalPages: persons.total_pages };
}

async function fetchMultiSearchQuery(query: string, page: string) {
  const results = await tmdbFetch<MultiSearchResponse>('/search/multi', {
    searchParams: {
      query,
      page,
      include_adult: 'false',
    },
    errorMessage: 'Failed fetching multi search results',
  });
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
 * Fetches search movies data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing movies array and total pages
 */
export async function getSearchMovies(
  query: string,
  page: number = 1,
): Promise<SearchMoviesResult> {
  const { movies, totalPages } = await fetchMoviesBySearchQuery(query, String(page));
  return { movies: movies.map(addPosterImageUrls), totalPages };
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
  page: number = 1,
): Promise<SearchTvShowsResult> {
  const { tvShows, totalPages } = await fetchTvShowsBySearchQuery(query, String(page));
  return { tvShows: tvShows.map(addPosterImageUrls), totalPages };
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
  page: number = 1,
): Promise<SearchPersonsResult> {
  const { persons, totalPages } = await fetchPersonsBySearchQuery(query, String(page));
  return { persons: persons.map(addProfileImageUrls), totalPages };
}

/**
 * Fetches multi search data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing mixed results array and total pages
 */
export async function getSearchMulti(query: string, page: number = 1): Promise<SearchMultiResult> {
  const { results, totalPages } = await fetchMultiSearchQuery(query, String(page));
  return {
    results: results.map((result) => {
      if (result.media_type === 'person') {
        return addProfileImageUrls(result);
      }

      if (result.media_type === 'movie' || result.media_type === 'tv') {
        return addPosterImageUrls(result);
      }

      return result;
    }),
    totalPages,
  };
}
