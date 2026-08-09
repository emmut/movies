'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { type DiscoverResult, getDiscoverMedia } from '@/lib/discover-client';
import { dedupeDiscoverResults } from '@/lib/discover-dedupe';
import { queryKeys } from '@/lib/query-keys';

const DISCOVER_STALE_TIME = 60 * 1000; // 1 minute

type UseDiscoverMediaParams = {
  mediaType: 'movie' | 'tv';
  genreId: number;
  page: number;
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
  runtimeLte?: number;
};

function discoverQueryKey({
  mediaType,
  genreId,
  page,
  sortBy,
  watchProviders,
  watchRegion,
  runtimeLte,
}: UseDiscoverMediaParams) {
  const params = {
    genreId,
    page,
    sortBy,
    watchProviders,
    watchRegion,
    withRuntimeLte: runtimeLte,
  };

  return mediaType === 'movie'
    ? queryKeys.discover.movies(params)
    : queryKeys.discover.tvShows(params);
}

/**
 * React Query hook for fetching discover media (movies or TV shows).
 * Automatically handles caching, loading states, and refetching.
 *
 * Adjacent discover pages can overlap because TMDb re-sorts the result set on
 * every request, so results already shown on the cached previous page are
 * filtered out. The next page is prefetched as soon as the current one
 * resolves — that makes pagination instant and keeps adjacent pages on
 * (nearly) the same TMDb ordering, which also shrinks the overlap itself.
 *
 * @param params - Parameters for the discover query
 * @returns Query result with data, loading state, and error state
 */
export function useDiscoverMedia(params: UseDiscoverMediaParams) {
  const { mediaType, genreId, page, sortBy, watchProviders, watchRegion, runtimeLte } = params;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: discoverQueryKey(params),
    queryFn: () =>
      getDiscoverMedia(mediaType, genreId, page, sortBy, watchProviders, watchRegion, runtimeLte),
    staleTime: DISCOVER_STALE_TIME,
    select: (data: DiscoverResult) => {
      if (page <= 1) {
        return data;
      }

      const previousPage = queryClient.getQueryData<DiscoverResult>(
        discoverQueryKey({ ...params, page: page - 1 }),
      );
      return dedupeDiscoverResults(data, previousPage?.results);
    },
  });

  const totalPages = query.data?.totalPages;

  useEffect(() => {
    if (totalPages === undefined || page >= totalPages) {
      return;
    }

    const nextPage = page + 1;
    void queryClient.prefetchQuery({
      queryKey: discoverQueryKey({
        mediaType,
        genreId,
        page: nextPage,
        sortBy,
        watchProviders,
        watchRegion,
        runtimeLte,
      }),
      queryFn: () =>
        getDiscoverMedia(
          mediaType,
          genreId,
          nextPage,
          sortBy,
          watchProviders,
          watchRegion,
          runtimeLte,
        ),
      staleTime: DISCOVER_STALE_TIME,
    });
  }, [
    queryClient,
    totalPages,
    mediaType,
    genreId,
    page,
    sortBy,
    watchProviders,
    watchRegion,
    runtimeLte,
  ]);

  return query;
}
