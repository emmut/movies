'use client';

import { useQuery } from '@tanstack/react-query';

import { getDiscoverMedia } from '@/lib/discover-client';
import { queryKeys } from '@/lib/query-keys';

export type DiscoverMediaParams = {
  mediaType: 'movie' | 'tv';
  genreIds: number[];
  keywordIds: number[];
  page: number;
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
  runtimeLte?: number;
  originCountry?: string;
};

/**
 * React Query hook for fetching discover media (movies or TV shows).
 * Automatically handles caching, loading states, and refetching.
 *
 * @param params - Parameters for the discover query
 * @returns Query result with data, loading state, and error state
 */
export function useDiscoverMedia({
  mediaType,
  genreIds,
  keywordIds,
  page,
  sortBy,
  watchProviders,
  watchRegion,
  runtimeLte,
  originCountry,
}: DiscoverMediaParams) {
  const params = {
    genreIds,
    keywordIds,
    page,
    sortBy,
    watchProviders,
    watchRegion,
    withRuntimeLte: runtimeLte,
    withOriginCountry: originCountry,
  };
  return useQuery({
    queryKey:
      mediaType === 'movie'
        ? queryKeys.discover.movies(params)
        : queryKeys.discover.tvShows(params),
    queryFn: () => getDiscoverMedia(mediaType, params),
    staleTime: 60 * 1000,
  });
}
