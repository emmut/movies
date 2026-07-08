'use server';

import { Movie, MultiSearchResponse, SearchedMovieResponse } from '@/types/movie';
import { SearchedPerson, SearchedPersonResponse } from '@/types/person';
import { SearchedTvResponse, TvShow } from '@/types/tv-show';

import { parseSearchQuery } from './parse-search-query';
import { addPosterImageUrls, addProfileImageUrls, tmdbFetch } from './tmdb';

async function fetchMoviesBySearchQuery(query: string, page: string, year?: number) {
  const movies = await tmdbFetch<SearchedMovieResponse>('/search/movie', {
    searchParams: {
      query,
      page,
      include_adult: 'false',
      include_video: 'false',
      primary_release_year: year,
    },
    errorMessage: 'Failed fetching searched movies',
  });
  return {
    movies: movies.results,
    totalPages: movies.total_pages,
    totalResults: movies.total_results,
  };
}

async function fetchTvShowsBySearchQuery(query: string, page: string, year?: number) {
  const tvShows = await tmdbFetch<SearchedTvResponse>('/search/tv', {
    searchParams: {
      query,
      page,
      include_adult: 'false',
      first_air_date_year: year,
    },
    errorMessage: 'Failed fetching searched TV shows',
  });
  return {
    tvShows: tvShows.results,
    totalPages: tvShows.total_pages,
    totalResults: tvShows.total_results,
  };
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

/**
 * Fetches search movies data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * A trailing year in the query (e.g. "heat 1995") is used as a release-year
 * filter; when the filtered search has no matches at all, the raw query is
 * retried unfiltered so misparsed titles still return results.
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing movies array and total pages
 */
export async function getSearchMovies(
  query: string,
  page: number = 1,
): Promise<SearchMoviesResult> {
  const { title, year } = parseSearchQuery(query);

  if (year !== undefined) {
    const filtered = await fetchMoviesBySearchQuery(title, String(page), year);
    if (filtered.totalResults > 0) {
      return { movies: filtered.movies.map(addPosterImageUrls), totalPages: filtered.totalPages };
    }
  }

  const { movies, totalPages } = await fetchMoviesBySearchQuery(query, String(page));
  return { movies: movies.map(addPosterImageUrls), totalPages };
}

/**
 * Fetches search TV shows data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * A trailing year in the query (e.g. "the office 2005") is used as a
 * first-air-date filter; when the filtered search has no matches at all, the
 * raw query is retried unfiltered.
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing TV shows array and total pages
 */
export async function getSearchTvShows(
  query: string,
  page: number = 1,
): Promise<SearchTvShowsResult> {
  const { title, year } = parseSearchQuery(query);

  if (year !== undefined) {
    const filtered = await fetchTvShowsBySearchQuery(title, String(page), year);
    if (filtered.totalResults > 0) {
      return {
        tvShows: filtered.tvShows.map(addPosterImageUrls),
        totalPages: filtered.totalPages,
      };
    }
  }

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
 * TMDB's multi endpoint has no year parameter, so when the query ends in a
 * year (e.g. "heat 1995") the movie and TV endpoints are searched in parallel
 * with the year filter and merged by popularity. When that yields nothing, the
 * raw query falls through to a plain multi search.
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing mixed results array and total pages
 */
export async function getSearchMulti(query: string, page: number = 1): Promise<SearchMultiResult> {
  const { title, year } = parseSearchQuery(query);

  if (year !== undefined) {
    const [movieResults, tvResults] = await Promise.all([
      fetchMoviesBySearchQuery(title, String(page), year),
      fetchTvShowsBySearchQuery(title, String(page), year),
    ]);

    if (movieResults.totalResults + tvResults.totalResults > 0) {
      const merged = [
        ...movieResults.movies.map((movie) => ({ ...movie, media_type: 'movie' as const })),
        ...tvResults.tvShows.map((tvShow) => ({ ...tvShow, media_type: 'tv' as const })),
      ].sort((a, b) => b.popularity - a.popularity);

      return {
        results: merged.map(addPosterImageUrls),
        totalPages: Math.max(movieResults.totalPages, tvResults.totalPages),
      };
    }
  }

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
