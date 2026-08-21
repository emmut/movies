'use client';

import { useQuery } from '@tanstack/react-query';

import { getDiscoverMedia } from '@/lib/discover-client';
import { queryKeys } from '@/lib/query-keys';

type UseDiscoverMediaParams = {
  mediaType: 'movie' | 'tv';
  genreId: number;
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
  genreId,
  page,
  sortBy,
  watchProviders,
  watchRegion,
  runtimeLte,
  originCountry,
}: UseDiscoverMediaParams) {
  return useQuery({
    queryKey:
      mediaType === 'movie'
        ? queryKeys.discover.movies({
            genreId,
            page,
            sortBy,
            watchProviders,
            watchRegion,
            withRuntimeLte: runtimeLte,
            withOriginCountry: originCountry,
          })
        : queryKeys.discover.tvShows({
            genreId,
            page,
            sortBy,
            watchProviders,
            watchRegion,
            withRuntimeLte: runtimeLte,
            withOriginCountry: originCountry,
          }),
    queryFn: () =>
      getDiscoverMedia(
        mediaType,
        genreId,
        page,
        sortBy,
        watchProviders,
        watchRegion,
        runtimeLte,
        originCountry,
      ),
    staleTime: 60 * 1000, // 1 minute
  });
}
