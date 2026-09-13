'use server';

import { cacheLife, cacheTag } from 'next/cache';

import { Movie, MultiSearchResponse, SearchedMovieResponse } from '@/types/movie';
import { SearchedPerson, SearchedPersonResponse } from '@/types/person';
import { SearchedTvResponse, TvShow } from '@/types/tv-show';

import { CACHE_TAGS } from './cache-tags';
import { ParsedSearchQuery, parseSearchQuery } from './parse-search-query';
import { hydrateSearchIndexHits, type SearchIndexHit, searchIndexFuzzy } from './search-index';
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

// The local index contributes a single ranked page. More candidates than this
// make the tail noisy and increase the chance of unnecessary hydration.
const FUZZY_FALLBACK_LIMIT = 10;
const SUGGESTION_LIMIT = 8;
// TMDB already supplies complete display data. When it has results, only pay
// details-call latency for a few strong local candidates that it missed.
const HYBRID_MISSING_RESULT_LIMIT = 3;
const RECIPROCAL_RANK_CONSTANT = 60;

type FuzzyMediaType = 'movie' | 'tv' | 'person';

/**
 * Fuzzy-matches the local trigram index (see `search_index`) for typos,
 * partial words, and swapped word order. Only on the first page, since it
 * yields one ranked page. The index is a convenience layer, so a failure (an
 * empty preview database, an outage) degrades to TMDB-only results.
 */
async function fuzzyHits(title: string, page: string, limit: number, mediaType?: FuzzyMediaType) {
  if (page !== '1') {
    return [];
  }
  try {
    return await searchIndexFuzzy(title, { mediaType, limit });
  } catch (error) {
    console.error('Fuzzy search index unavailable; skipping:', error);
    return [];
  }
}

type HybridResult = { id: number; media_type?: string };

function resultKey(result: HybridResult, defaultMediaType?: FuzzyMediaType) {
  return `${result.media_type ?? defaultMediaType}:${result.id}`;
}

function hitKey(hit: SearchIndexHit) {
  return `${hit.mediaType}:${hit.tmdbId}`;
}

function reciprocalRank(rank: number) {
  return 1 / (RECIPROCAL_RANK_CONSTANT + rank);
}

/**
 * Combines TMDB's ranking with the local index using reciprocal-rank fusion.
 * A result found by both sources naturally outranks a one-source candidate,
 * without pretending TMDB popularity and trigram similarity share a scale.
 */
function fuseResults<T extends HybridResult>(
  tmdbResults: T[],
  localHits: SearchIndexHit[],
  hydratedLocalResults: MultiSearchResponse['results'],
  defaultMediaType?: FuzzyMediaType,
) {
  const candidates = new Map<string, T | MultiSearchResponse['results'][number]>();
  const scores = new Map<string, number>();

  for (const [index, result] of tmdbResults.entries()) {
    const key = resultKey(result, defaultMediaType);
    candidates.set(key, result);
    scores.set(key, reciprocalRank(index + 1));
  }
  for (const result of hydratedLocalResults) {
    const key = resultKey(result);
    if (!candidates.has(key)) {
      candidates.set(key, result);
    }
  }
  for (const [index, hit] of localHits.entries()) {
    const key = hitKey(hit);
    if (candidates.has(key)) {
      scores.set(key, (scores.get(key) ?? 0) + reciprocalRank(index + 1));
    }
  }

  return [...candidates.entries()]
    .sort(([leftKey], [rightKey]) => (scores.get(rightKey) ?? 0) - (scores.get(leftKey) ?? 0))
    .map(([, result]) => result);
}

async function hybridResults<T extends HybridResult>(
  tmdbResults: T[],
  localHits: SearchIndexHit[],
  fallbackLimit: number,
  defaultMediaType?: FuzzyMediaType,
) {
  const tmdbKeys = new Set(tmdbResults.map((result) => resultKey(result, defaultMediaType)));
  const missingLimit = tmdbResults.length > 0 ? HYBRID_MISSING_RESULT_LIMIT : fallbackLimit;
  const missingHits = localHits.filter((hit) => !tmdbKeys.has(hitKey(hit))).slice(0, missingLimit);
  const hydrated = missingHits.length > 0 ? await hydrateSearchIndexHits(missingHits) : [];
  return fuseResults(tmdbResults, localHits, hydrated, defaultMediaType);
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
 * Merges one typed TMDB result page with local candidates and preserves the
 * endpoint's original result shape.
 */
async function mergeTypedResults<T extends HybridResult>(
  results: T[],
  totalPages: number,
  localHits: SearchIndexHit[],
  mediaType: FuzzyMediaType,
) {
  const matchingHits = localHits.filter((hit) => hit.mediaType === mediaType);
  const hybrid = await hybridResults(results, matchingHits, FUZZY_FALLBACK_LIMIT, mediaType);
  const matching = hybrid.filter(
    (result) => result.media_type === undefined || result.media_type === mediaType,
  ) as unknown as T[];
  return {
    results: matching,
    totalPages: results.length === 0 && matching.length > 0 ? 1 : totalPages,
  };
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
  let localHitsPromise =
    parsed.year === undefined
      ? fuzzyHits(parsed.title, String(page), FUZZY_FALLBACK_LIMIT, 'movie')
      : undefined;

  if (hasQueryFilters(parsed)) {
    const filtered = await fetchMoviesBySearchQuery(parsed.title, String(page), parsed.year);
    if (filtered.totalResults > 0) {
      if (parsed.year !== undefined) {
        return { movies: filtered.movies.map(addPosterImageUrls), totalPages: filtered.totalPages };
      }
      const hybrid = await mergeTypedResults(
        filtered.movies,
        filtered.totalPages,
        await (localHitsPromise ?? Promise.resolve([])),
        'movie',
      );
      return { movies: hybrid.results.map(addPosterImageUrls), totalPages: hybrid.totalPages };
    }
  }

  localHitsPromise ??= fuzzyHits(parsed.title, String(page), FUZZY_FALLBACK_LIMIT, 'movie');
  const [raw, localHits] = await Promise.all([
    fetchMoviesBySearchQuery(query, String(page)),
    localHitsPromise,
  ]);
  const { results, totalPages } = await mergeTypedResults(
    raw.movies,
    raw.totalPages,
    localHits,
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
  let localHitsPromise =
    parsed.year === undefined
      ? fuzzyHits(parsed.title, String(page), FUZZY_FALLBACK_LIMIT, 'tv')
      : undefined;

  if (hasQueryFilters(parsed)) {
    const filtered = await fetchTvShowsBySearchQuery(parsed.title, String(page), parsed.year);
    if (filtered.totalResults > 0) {
      if (parsed.year !== undefined) {
        return {
          tvShows: filtered.tvShows.map(addPosterImageUrls),
          totalPages: filtered.totalPages,
        };
      }
      const hybrid = await mergeTypedResults(
        filtered.tvShows,
        filtered.totalPages,
        await (localHitsPromise ?? Promise.resolve([])),
        'tv',
      );
      return { tvShows: hybrid.results.map(addPosterImageUrls), totalPages: hybrid.totalPages };
    }
  }

  localHitsPromise ??= fuzzyHits(parsed.title, String(page), FUZZY_FALLBACK_LIMIT, 'tv');
  const [raw, localHits] = await Promise.all([
    fetchTvShowsBySearchQuery(query, String(page)),
    localHitsPromise,
  ]);
  const { results, totalPages } = await mergeTypedResults(
    raw.tvShows,
    raw.totalPages,
    localHits,
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
  const localHitsPromise = fuzzyHits(parsed.title, String(page), FUZZY_FALLBACK_LIMIT, 'person');

  if (hasQueryFilters(parsed)) {
    const filtered = await fetchPersonsBySearchQuery(parsed.title, String(page));
    if (filtered.totalResults > 0) {
      const hybrid = await mergeTypedResults(
        filtered.persons,
        filtered.totalPages,
        await localHitsPromise,
        'person',
      );
      return { persons: hybrid.results.map(addProfileImageUrls), totalPages: hybrid.totalPages };
    }
  }

  const [raw, localHits] = await Promise.all([
    fetchPersonsBySearchQuery(query, String(page)),
    localHitsPromise,
  ]);
  const { results, totalPages } = await mergeTypedResults(
    raw.persons,
    raw.totalPages,
    localHits,
    'person',
  );
  return { persons: results.map(addProfileImageUrls), totalPages };
}

function displayMultiResult(
  results: MultiSearchResponse['results'],
  totalPages: number,
): SearchMultiResult {
  return { results: results.map(withImageUrls), totalPages };
}

async function hybridMultiResult(
  tmdbResult: SearchMultiResult,
  localHits: SearchIndexHit[],
  fallbackLimit: number,
) {
  const hybrid = await hybridResults(tmdbResult.results, localHits, fallbackLimit);
  const totalPages =
    tmdbResult.results.length === 0 && hybrid.length > 0 ? 1 : tmdbResult.totalPages;
  return displayMultiResult(hybrid as MultiSearchResponse['results'], totalPages);
}

async function fallbackMultiSearch(
  query: string,
  parsed: ParsedSearchQuery,
  page: string,
  fallbackLimit: number,
) {
  const raw = await fetchMultiSearchQuery(query, page);
  if (raw.results.length > 0) {
    return displayMultiResult(raw.results, raw.totalPages);
  }
  const localHits = await fuzzyHits(parsed.title, page, fallbackLimit, parsed.mediaType);
  return await hybridMultiResult(raw, localHits, fallbackLimit);
}

async function hybridMultiSearch(
  query: string,
  parsed: ParsedSearchQuery,
  page: string,
  fallbackLimit: number,
  localHitsPromise?: Promise<SearchIndexHit[]>,
) {
  const [raw, localHits] = await Promise.all([
    fetchMultiSearchQuery(query, page),
    localHitsPromise ?? fuzzyHits(parsed.title, page, fallbackLimit, parsed.mediaType),
  ]);
  return await hybridMultiResult(raw, localHits, fallbackLimit);
}

async function searchMulti(
  query: string,
  page: number,
  fallbackLimit: number,
  useHybridSearch: boolean,
): Promise<SearchMultiResult> {
  const parsed = parseSearchQuery(query);
  const pageString = String(page);
  const localHitsPromise =
    useHybridSearch && parsed.year === undefined
      ? fuzzyHits(parsed.title, pageString, fallbackLimit, parsed.mediaType)
      : undefined;
  const filtered = await searchMultiFiltered(parsed, pageString);

  if (filtered && localHitsPromise) {
    return await hybridMultiResult(filtered, await localHitsPromise, fallbackLimit);
  }
  if (filtered) {
    return displayMultiResult(filtered.results, filtered.totalPages);
  }
  if (!useHybridSearch) {
    return await fallbackMultiSearch(query, parsed, pageString, fallbackLimit);
  }
  return await hybridMultiSearch(query, parsed, pageString, fallbackLimit, localHitsPromise);
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
 * are not lost to the filter, and merged by popularity. On the first page,
 * ordinary title searches merge TMDB and local fuzzy candidates with
 * reciprocal-rank fusion. Year-filtered searches remain TMDB-only because
 * the daily export does not contain release dates.
 *
 * @param query - The search query string
 * @param page - The page number to fetch
 * @returns Object containing mixed results array and total pages
 */
export async function getSearchMulti(query: string, page: number = 1): Promise<SearchMultiResult> {
  return await searchMulti(query, page, FUZZY_FALLBACK_LIMIT, true);
}

/**
 * Command-palette suggestions stay TMDB-first so a sleeping database cannot
 * delay every keystroke. The local index remains the typo fallback when TMDB
 * returns nothing, sized to the dropdown.
 *
 * @param query - The search query string, as typed.
 * @returns A single page of mixed results in the multi-search shape.
 */
export async function getSearchSuggestions(query: string): Promise<SearchMultiResult> {
  return await searchMulti(query, 1, SUGGESTION_LIMIT, false);
}
