'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import {
  getSearchMovies,
  getSearchMulti,
  getSearchPersons,
  getSearchSuggestions,
  getSearchTvShows,
  SearchMoviesResult,
  SearchMultiResult,
  SearchPersonsResult,
  SearchTvShowsResult,
} from '@/lib/search';

type UseSearchParams = {
  query: string;
  page: number;
  enabled?: boolean;
};

/**
 * React Query hook for fetching movie search results.
 * Automatically handles caching, loading states, and refetching.
 *
 * @param params - Parameters for the search query
 * @returns Query result with data, loading state, and error state
 */
export function useSearchMovies({ query, page, enabled = true }: UseSearchParams) {
  return useQuery<SearchMoviesResult>({
    queryKey: queryKeys.search.movies(query, page),
    queryFn: () => getSearchMovies(query, page),
    enabled: query.length > 0 && enabled,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * React Query hook for fetching TV show search results.
 * Automatically handles caching, loading states, and refetching.
 *
 * @param params - Parameters for the search query
 * @returns Query result with data, loading state, and error state
 */
export function useSearchTvShows({ query, page, enabled = true }: UseSearchParams) {
  return useQuery<SearchTvShowsResult>({
    queryKey: queryKeys.search.tvShows(query, page),
    queryFn: () => getSearchTvShows(query, page),
    enabled: query.length > 0 && enabled,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * React Query hook for fetching person search results.
 * Automatically handles caching, loading states, and refetching.
 *
 * @param params - Parameters for the search query
 * @returns Query result with data, loading state, and error state
 */
export function useSearchPersons({ query, page, enabled = true }: UseSearchParams) {
  return useQuery<SearchPersonsResult>({
    queryKey: queryKeys.search.persons(query, page),
    queryFn: () => getSearchPersons(query, page),
    enabled: query.length > 0 && enabled,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * React Query hook for fetching multi search results (movies, TV shows, and persons).
 * Automatically handles caching, loading states, and refetching.
 *
 * @param params - Parameters for the search query
 * @returns Query result with data, loading state, and error state
 */
export function useSearchMulti({ query, page, enabled = true }: UseSearchParams) {
  return useQuery<SearchMultiResult>({
    queryKey: queryKeys.search.multi(query, page),
    queryFn: () => getSearchMulti(query, page),
    enabled: query.length > 0 && enabled,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * React Query hook for command-palette suggestions: the local fuzzy index
 * first, TMDB as fallback. Keeps the previous suggestions visible while a new
 * query is fetching so the list doesn't flicker on every keystroke.
 *
 * @param query - The debounced, trimmed query.
 * @returns Query result with data, loading state, and error state
 */
export function useSearchSuggestions(query: string) {
  return useQuery<SearchMultiResult>({
    queryKey: queryKeys.search.suggestions(query),
    queryFn: () => getSearchSuggestions(query),
    enabled: query.length > 0,
    staleTime: 60 * 1000, // 1 minute
    placeholderData: keepPreviousData,
  });
}
