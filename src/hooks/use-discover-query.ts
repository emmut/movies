'use client';

import { getDiscoverMedia } from '@/lib/discover-client';
import { queryKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';

type UseDiscoverMediaParams = {
  mediaType: 'movie' | 'tv';
  genreId: number;
  page: number;
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
  runtimeLte?: number;
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
          })
        : queryKeys.discover.tvShows({
            genreId,
            page,
            sortBy,
            watchProviders,
            watchRegion,
            withRuntimeLte: runtimeLte,
          }),
    queryFn: () =>
      getDiscoverMedia(
        mediaType,
        genreId,
        page,
        sortBy,
        watchProviders,
        watchRegion,
        runtimeLte
      ),
    staleTime: 60 * 1000, // 1 minute
  });
}
