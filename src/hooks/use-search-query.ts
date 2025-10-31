'use client';

import { queryKeys } from '@/lib/query-keys';
import {
  getSearchMovies,
  getSearchMulti,
  getSearchPersons,
  getSearchTvShows,
  SearchResult,
} from '@/lib/search';
import { MediaType } from '@/types/media-type';
import { useQuery } from '@tanstack/react-query';

type UseSearchQueryParams = {
  query: string;
  page: number;
  mediaType: MediaType;
};

/**
 * React Query hook for fetching search results (movies, TV shows, persons, or mixed).
 * Automatically handles caching, loading states, and refetching.
 *
 * @param params - Parameters for the search query
 * @returns Query result with data, loading state, and error state
 */
export function useSearchQuery({
  query,
  page,
  mediaType,
}: UseSearchQueryParams) {
  return useQuery<SearchResult>({
    queryKey:
      mediaType === 'movie'
        ? queryKeys.search.movies(query, page)
        : mediaType === 'tv'
          ? queryKeys.search.tvShows(query, page)
          : mediaType === 'person'
            ? queryKeys.search.persons(query, page)
            : queryKeys.search.multi(query, page),
    queryFn: () => {
      if (mediaType === 'movie') {
        return getSearchMovies(query, page);
      } else if (mediaType === 'tv') {
        return getSearchTvShows(query, page);
      } else if (mediaType === 'person') {
        return getSearchPersons(query, page);
      } else {
        return getSearchMulti(query, page);
      }
    },
    enabled: query.length > 0,
    staleTime: 60 * 1000, // 1 minute
  });
}
