'use server';

import { cacheLife, cacheTag } from 'next/cache';

import { Movie, MultiSearchResponse, SearchedMovieResponse } from '@/types/movie';
import { SearchedPerson, SearchedPersonResponse } from '@/types/person';
import { SearchedTvResponse, TvShow } from '@/types/tv-show';

import { CACHE_TAGS } from './cache-tags';
import { ParsedSearchQuery, parseSearchQuery } from './parse-search-query';
import { searchIndexResults } from './search-index';
import { RankableResult, rankByTitleMatch } from './search-rank';
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

// The index yields one ranked page, each hit hydrated with one cached TMDB
// details call; more than this and the tail is noise paid for in latency.
const INDEX_PAGE_LIMIT = 10;
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

type SearchHit = { id: number; media_type?: string } & RankableResult;

type SearchPage<T> = { results: T[]; totalPages: number };

/**
 * How the local index takes part in a search.
 *
 * - `merge`: on the first page, the index runs alongside TMDB and its hits
 *   are added to TMDB's page, so a close match TMDB buried on a later page
 *   (or a typo it cannot match at all) still surfaces at the top. Used by the
 *   full search page.
 * - `fallback`: the index is consulted only when TMDB has nothing. Used by
 *   the command palette, where every keystroke would otherwise pay a database
 *   round trip plus a details fetch per hit.
 */
type IndexMode = 'merge' | 'fallback';

type IndexOptions = {
  parsed: ParsedSearchQuery;
  page: string;
  limit: number;
  mode: IndexMode;
};

/**
 * Appends index hits TMDB's page does not already have, keyed by media type
 * and id. Single-type pages carry no `media_type`, so the requested type
 * stands in for it.
 */
function mergeUnique<T extends SearchHit>(tmdb: T[], hits: T[], mediaType?: FuzzyMediaType): T[] {
  function keyOf(result: T) {
    return `${result.media_type ?? mediaType}:${result.id}`;
  }
  const known = new Set(tmdb.map(keyOf));
  return [...tmdb, ...hits.filter((hit) => !known.has(keyOf(hit)))];
}

/**
 * Completes a TMDB page with the local index and ranks it (see
 * {@link rankByTitleMatch}). TMDB orders by a popularity blend, which puts
 * "Alien: Romulus" above "Alien" for the query "alien"; the re-rank corrects
 * that without dropping anything. Index hits are ranked on equal terms but
 * queue behind TMDB's own results within a tier.
 *
 * The index has no release-year data, so a year-filtered page only receives
 * hits when TMDB found nothing at all. When TMDB is empty the index page
 * stands in for it as a single page.
 */
async function completeWithIndex<T extends SearchHit>(
  tmdbPage: Promise<SearchPage<T>>,
  { parsed, page, limit, mode }: IndexOptions,
): Promise<SearchPage<T>> {
  const { title, mediaType } = parsed;
  const merge = mode === 'merge' && parsed.year === undefined;
  const eager = merge ? fuzzyResults(title, page, limit, mediaType) : undefined;

  const tmdb = await tmdbPage;
  const hits = (eager
    ? await eager
    : tmdb.results.length > 0
      ? []
      : await fuzzyResults(title, page, limit, mediaType)
  ).filter((hit) => mediaType === undefined || hit.media_type === mediaType) as unknown as T[];

  if (tmdb.results.length === 0) {
    return { results: hits, totalPages: hits.length > 0 ? 1 : tmdb.totalPages };
  }
  return {
    results: rankByTitleMatch(title, mergeUnique(tmdb.results, hits, mediaType)),
    totalPages: tmdb.totalPages,
  };
}

type TmdbPage<T> = SearchPage<T> & { totalResults: number };

/**
 * One TMDB page for a single-type search: with the parsed filters first, and
 * when that has no matches at all, the raw query unfiltered so misparsed
 * titles still return results.
 */
async function fetchSingleTypePage<T>(
  parsed: ParsedSearchQuery,
  query: string,
  fetchPage: (title: string, year?: number) => Promise<TmdbPage<T>>,
): Promise<SearchPage<T>> {
  if (hasQueryFilters(parsed)) {
    const filtered = await fetchPage(parsed.title, parsed.year);
    if (filtered.totalResults > 0) {
      return filtered;
    }
  }
  return fetchPage(query);
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
    results: movies.map((movie) => ({ ...movie, media_type: 'movie' as const })),
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
    results: tvShows.map((tvShow) => ({ ...tvShow, media_type: 'tv' as const })),
    totalPages,
  };
}

async function searchMultiPersons(title: string, page: string): Promise<SearchMultiResult | null> {
  const { persons, totalPages, totalResults } = await fetchPersonsBySearchQuery(title, page);

  if (totalResults === 0) {
    return null;
  }

  return {
    results: persons.map((person) => ({ ...person, media_type: 'person' as const })),
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
    ...movieResults.movies.map((movie) => ({ ...movie, media_type: 'movie' as const })),
    ...tvResults.tvShows.map((tvShow) => ({ ...tvShow, media_type: 'tv' as const })),
    ...personResults.persons.map((person) => ({ ...person, media_type: 'person' as const })),
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
 * One TMDB page for the multi search: the filtered path when the query has a
 * year or media-type keyword and it finds anything, else the raw query on the
 * plain multi endpoint.
 */
async function fetchMultiPage(
  parsed: ParsedSearchQuery,
  query: string,
  page: string,
): Promise<SearchMultiResult> {
  const filtered = await searchMultiFiltered(parsed, page);
  if (filtered) {
    return filtered;
  }
  return fetchMultiSearchQuery(query, page);
}

/**
 * Fetches search movies data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * A trailing year in the query (e.g. "heat 1995") is used as a release-year
 * filter, and a trailing media-type keyword (e.g. "heat movie") is stripped
 * from the title. When the filtered search has no matches at all, the raw
 * query is retried unfiltered so misparsed titles still return results. On
 * the first page the local fuzzy index is merged in and close title matches
 * are ranked first.
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
  const { results, totalPages } = await completeWithIndex(
    fetchSingleTypePage(parsed, query, async (title, year) => {
      const { movies, ...rest } = await fetchMoviesBySearchQuery(title, String(page), year);
      return { results: movies, ...rest };
    }),
    {
      parsed: { ...parsed, mediaType: 'movie' },
      page: String(page),
      limit: INDEX_PAGE_LIMIT,
      mode: 'merge',
    },
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
 * retried unfiltered. On the first page the local fuzzy index is merged in
 * and close title matches are ranked first.
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
  const { results, totalPages } = await completeWithIndex(
    fetchSingleTypePage(parsed, query, async (title, year) => {
      const { tvShows, ...rest } = await fetchTvShowsBySearchQuery(title, String(page), year);
      return { results: tvShows, ...rest };
    }),
    {
      parsed: { ...parsed, mediaType: 'tv' },
      page: String(page),
      limit: INDEX_PAGE_LIMIT,
      mode: 'merge',
    },
  );
  return { tvShows: results.map(addPosterImageUrls), totalPages };
}

/**
 * Fetches search persons data for use with React Query.
 * Can be called on both server and client (via server actions).
 *
 * Trailing year and media-type tokens (e.g. "brad pitt person") are stripped
 * from the title before searching; persons have no year filter. When the
 * stripped search has no matches at all, the raw query is retried. On the
 * first page the local fuzzy index is merged in and close name matches are
 * ranked first.
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
  const { results, totalPages } = await completeWithIndex(
    fetchSingleTypePage(parsed, query, async (title) => {
      const { persons, ...rest } = await fetchPersonsBySearchQuery(title, String(page));
      return { results: persons, ...rest };
    }),
    {
      parsed: { ...parsed, mediaType: 'person' },
      page: String(page),
      limit: INDEX_PAGE_LIMIT,
      mode: 'merge',
    },
  );
  return { persons: results.map(addProfileImageUrls), totalPages };
}

async function searchMulti(
  query: string,
  page: number,
  limit: number,
  mode: IndexMode,
): Promise<SearchMultiResult> {
  const parsed = parseSearchQuery(query);
  const { results, totalPages } = await completeWithIndex(
    fetchMultiPage(parsed, query, String(page)),
    { parsed, page: String(page), limit, mode },
  );
  return { results: results.map(withImageUrls), totalPages };
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
 * yields nothing, the raw query falls through to a plain multi search. On the
 * first page the local fuzzy index runs alongside TMDB and its hits are
 * merged in, and close title matches are ranked first.
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing mixed results array and total pages
 */
export async function getSearchMulti(query: string, page: number = 1): Promise<SearchMultiResult> {
  return await searchMulti(query, page, INDEX_PAGE_LIMIT, 'merge');
}

/**
 * Command-palette suggestions: the same TMDB-first search as
 * {@link getSearchMulti}, sized for a dropdown. TMDB answers in one request
 * with posters included; the fuzzy index only steps in when TMDB has nothing
 * (a typo, a misspelt name), since each of its hits costs a details lookup.
 *
 * @param query - The search query string, as typed.
 * @returns A single page of mixed results in the multi-search shape.
 */
export async function getSearchSuggestions(query: string): Promise<SearchMultiResult> {
  return await searchMulti(query, 1, SUGGESTION_LIMIT, 'fallback');
}
