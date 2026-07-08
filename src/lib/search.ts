'use server';

import { Movie, MultiSearchResponse, SearchedMovieResponse } from '@/types/movie';
import { SearchedPerson, SearchedPersonResponse } from '@/types/person';
import { SearchedTvResponse, TvShow } from '@/types/tv-show';

import { ParsedSearchQuery, parseSearchQuery } from './parse-search-query';
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
  return {
    persons: persons.results,
    totalPages: persons.total_pages,
    totalResults: persons.total_results,
  };
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

function hasQueryFilters(parsed: ParsedSearchQuery) {
  return parsed.year !== undefined || parsed.mediaType !== undefined;
}

async function searchMultiMovies(
  title: string,
  page: string,
  year?: number,
): Promise<SearchMultiResult | null> {
  const { movies, totalPages, totalResults } = await fetchMoviesBySearchQuery(title, page, year);

  if (totalResults === 0) {
    return null;
  }

  return {
    results: movies.map((movie) => addPosterImageUrls({ ...movie, media_type: 'movie' as const })),
    totalPages,
  };
}

async function searchMultiTvShows(
  title: string,
  page: string,
  year?: number,
): Promise<SearchMultiResult | null> {
  const { tvShows, totalPages, totalResults } = await fetchTvShowsBySearchQuery(title, page, year);

  if (totalResults === 0) {
    return null;
  }

  return {
    results: tvShows.map((tvShow) => addPosterImageUrls({ ...tvShow, media_type: 'tv' as const })),
    totalPages,
  };
}

async function searchMultiPersons(title: string, page: string): Promise<SearchMultiResult | null> {
  const { persons, totalPages, totalResults } = await fetchPersonsBySearchQuery(title, page);

  if (totalResults === 0) {
    return null;
  }

  return {
    results: persons.map((person) =>
      addProfileImageUrls({ ...person, media_type: 'person' as const }),
    ),
    totalPages,
  };
}

async function searchMultiByType(
  parsed: ParsedSearchQuery,
  page: string,
): Promise<SearchMultiResult | null> {
  if (parsed.mediaType === 'movie') {
    return searchMultiMovies(parsed.title, page, parsed.year);
  }

  if (parsed.mediaType === 'tv') {
    return searchMultiTvShows(parsed.title, page, parsed.year);
  }

  return searchMultiPersons(parsed.title, page);
}

async function searchMultiYearFanout(
  title: string,
  page: string,
  year: number,
): Promise<SearchMultiResult | null> {
  const [movieResults, tvResults, personResults] = await Promise.all([
    fetchMoviesBySearchQuery(title, page, year),
    fetchTvShowsBySearchQuery(title, page, year),
    fetchPersonsBySearchQuery(title, page),
  ]);

  const totalResults =
    movieResults.totalResults + tvResults.totalResults + personResults.totalResults;

  if (totalResults === 0) {
    return null;
  }

  const merged = [
    ...movieResults.movies.map((movie) =>
      addPosterImageUrls({ ...movie, media_type: 'movie' as const }),
    ),
    ...tvResults.tvShows.map((tvShow) =>
      addPosterImageUrls({ ...tvShow, media_type: 'tv' as const }),
    ),
    ...personResults.persons.map((person) =>
      addProfileImageUrls({ ...person, media_type: 'person' as const }),
    ),
  ].sort((a, b) => b.popularity - a.popularity);

  return {
    results: merged,
    totalPages: Math.max(movieResults.totalPages, tvResults.totalPages, personResults.totalPages),
  };
}

async function searchMultiFiltered(
  parsed: ParsedSearchQuery,
  page: string,
): Promise<SearchMultiResult | null> {
  if (parsed.mediaType !== undefined) {
    return searchMultiByType(parsed, page);
  }

  if (parsed.year !== undefined) {
    return searchMultiYearFanout(parsed.title, page, parsed.year);
  }

  return null;
}

/**
 * Fetches search movies data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * A trailing year in the query (e.g. "heat 1995") is used as a release-year
 * filter, and a trailing media-type keyword (e.g. "heat movie") is stripped
 * from the title. When the filtered search has no matches at all, the raw
 * query is retried unfiltered so misparsed titles still return results.
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing movies array and total pages
 */
export async function getSearchMovies(
  query: string,
  page: number = 1,
): Promise<SearchMoviesResult> {
  const parsed = parseSearchQuery(query);

  if (hasQueryFilters(parsed)) {
    const filtered = await fetchMoviesBySearchQuery(parsed.title, String(page), parsed.year);
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
 * first-air-date filter, and a trailing media-type keyword is stripped from
 * the title. When the filtered search has no matches at all, the raw query is
 * retried unfiltered.
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing TV shows array and total pages
 */
export async function getSearchTvShows(
  query: string,
  page: number = 1,
): Promise<SearchTvShowsResult> {
  const parsed = parseSearchQuery(query);

  if (hasQueryFilters(parsed)) {
    const filtered = await fetchTvShowsBySearchQuery(parsed.title, String(page), parsed.year);
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
 * Trailing year and media-type tokens (e.g. "brad pitt person") are stripped
 * from the title before searching; persons have no year filter. When the
 * stripped search has no matches at all, the raw query is retried.
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing persons array and total pages
 */
export async function getSearchPersons(
  query: string,
  page: number = 1,
): Promise<SearchPersonsResult> {
  const parsed = parseSearchQuery(query);

  if (hasQueryFilters(parsed)) {
    const filtered = await fetchPersonsBySearchQuery(parsed.title, String(page));
    if (filtered.totalResults > 0) {
      return {
        persons: filtered.persons.map(addProfileImageUrls),
        totalPages: filtered.totalPages,
      };
    }
  }

  const { persons, totalPages } = await fetchPersonsBySearchQuery(query, String(page));
  return { persons: persons.map(addProfileImageUrls), totalPages };
}

/**
 * Fetches multi search data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * A trailing media-type keyword ("heat movie", "the office tv show",
 * "brad pitt person") narrows the search to that endpoint. Otherwise, when the
 * query ends in a year (e.g. "heat 1995") — TMDB's multi endpoint has no year
 * parameter — the movie and TV endpoints are searched in parallel with the
 * year filter, plus the person endpoint with the year-stripped title so people
 * are not lost to the filter, and merged by popularity. When all of that
 * yields nothing, the raw query falls through to a plain multi search.
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing mixed results array and total pages
 */
export async function getSearchMulti(query: string, page: number = 1): Promise<SearchMultiResult> {
  const parsed = parseSearchQuery(query);
  const filtered = await searchMultiFiltered(parsed, String(page));

  if (filtered) {
    return filtered;
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
