'use server';

import { cacheLife, cacheTag } from 'next/cache';

import { Movie, MultiSearchResponse, SearchedMovieResponse } from '@/types/movie';
import { SearchedPerson, SearchedPersonResponse } from '@/types/person';
import { SearchedTvResponse, TvShow } from '@/types/tv-show';

import { CACHE_TAGS } from './cache-tags';
import { ParsedSearchQuery, parseSearchQuery } from './parse-search-query';
import { searchIndexResults } from './search-index';
import { addPosterImageUrls, addProfileImageUrls, tmdbFetch } from './tmdb';

async function fetchMoviesBySearchQuery(query: string, page: string, year?: number) {
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.search);
  cacheLife('hours');

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
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.search);
  cacheLife('hours');

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
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.search);
  cacheLife('hours');

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
  'use cache: remote';
  cacheTag(CACHE_TAGS.public.search);
  cacheLife('hours');

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

// Fuzzy results are a single ranked page; more than this and the tail is noise.
const FUZZY_FALLBACK_LIMIT = 20;
const SUGGESTION_LIMIT = 8;

type FuzzyMediaType = 'movie' | 'tv' | 'person';

/**
 * Fuzzy-matches the local trigram index (see `search_index`) for queries
 * TMDB's literal search cannot answer: typos, partial words, swapped word
 * order. Only on the first page, since it yields one ranked page. The index
 * is a convenience layer, so a failure (an empty preview database, an
 * outage) degrades to no extra results rather than failing the search.
 */
async function fuzzyResults(
  title: string,
  page: string,
  limit: number,
  mediaType?: FuzzyMediaType,
) {
  if (page !== '1') {
    return [];
  }
  try {
    return await searchIndexResults(title, { mediaType, limit });
  } catch (error) {
    console.error('Fuzzy search index unavailable; skipping:', error);
    return [];
  }
}

function withImageUrls(result: MultiSearchResponse['results'][number]) {
  if (result.media_type === 'person') {
    return addProfileImageUrls(result);
  }
  if (result.media_type === 'movie' || result.media_type === 'tv') {
    return addPosterImageUrls(result);
  }
  return result;
}

/**
 * When TMDB found nothing for one media type, the fuzzy fallback for it;
 * otherwise the TMDB results untouched.
 */
async function fuzzyFallback<T extends { id: number }>(
  results: T[],
  totalPages: number,
  title: string,
  page: string,
  mediaType: FuzzyMediaType,
) {
  if (results.length > 0) {
    return { results, totalPages };
  }
  const fallback = (await fuzzyResults(title, page, FUZZY_FALLBACK_LIMIT, mediaType)).filter(
    (result) => result.media_type === mediaType,
  ) as unknown as T[];
  return { results: fallback, totalPages: fallback.length > 0 ? 1 : totalPages };
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

  const raw = await fetchMoviesBySearchQuery(query, String(page));
  const { results, totalPages } = await fuzzyFallback(
    raw.movies,
    raw.totalPages,
    parsed.title,
    String(page),
    'movie',
  );
  return { movies: results.map(addPosterImageUrls), totalPages };
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

  const raw = await fetchTvShowsBySearchQuery(query, String(page));
  const { results, totalPages } = await fuzzyFallback(
    raw.tvShows,
    raw.totalPages,
    parsed.title,
    String(page),
    'tv',
  );
  return { tvShows: results.map(addPosterImageUrls), totalPages };
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

  const raw = await fetchPersonsBySearchQuery(query, String(page));
  const { results, totalPages } = await fuzzyFallback(
    raw.persons,
    raw.totalPages,
    parsed.title,
    String(page),
    'person',
  );
  return { persons: results.map(addProfileImageUrls), totalPages };
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

  const raw = await fetchMultiSearchQuery(query, String(page));
  if (raw.results.length > 0) {
    return { results: raw.results.map(withImageUrls), totalPages: raw.totalPages };
  }

  // TMDB's literal match found nothing: try the fuzzy index (typos, partial
  // words) with the parsed title, narrowed to a media type when one was given.
  const fuzzy = await fuzzyResults(
    parsed.title,
    String(page),
    FUZZY_FALLBACK_LIMIT,
    parsed.mediaType,
  );
  return { results: fuzzy.map(withImageUrls), totalPages: fuzzy.length > 0 ? 1 : raw.totalPages };
}

/**
 * Command-palette suggestions: local-first. The trigram index answers in
 * milliseconds and tolerates typing in progress and misspellings; TMDB's
 * search is the fallback when the index has nothing (a query too short to
 * trigram-match, a database without the index loaded, no match at all).
 *
 * @param query - The search query string, as typed.
 * @returns A single page of mixed results in the multi-search shape.
 */
export async function getSearchSuggestions(query: string): Promise<SearchMultiResult> {
  const parsed = parseSearchQuery(query);
  const fuzzy = await fuzzyResults(parsed.title, '1', SUGGESTION_LIMIT, parsed.mediaType);

  if (fuzzy.length > 0) {
    return { results: fuzzy.map(withImageUrls), totalPages: 1 };
  }

  return await getSearchMulti(query, 1);
}
