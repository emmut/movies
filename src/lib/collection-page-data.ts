import 'server-only';
import { dehydrate } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import { getUser } from '@/lib/auth-server';
import {
  COLLECTION_GC_TIME,
  COLLECTION_STALE_TIME,
  CollectionCountFetcher,
  CollectionMediaType,
  CollectionPageFetcher,
  CollectionQueryKeys,
} from '@/lib/collection-query';
import { getQueryClient } from '@/lib/query-client';

type CollectionPageDataOptions = {
  searchParams: Promise<{ mediaType?: string; page?: string }>;
  keys: CollectionQueryKeys;
  fetchPage: CollectionPageFetcher;
  fetchCount: CollectionCountFetcher;
};

function parseCollectionSearchParams(params: { mediaType?: string; page?: string }) {
  return {
    mediaType: (params.mediaType ?? 'movie') as CollectionMediaType,
    page: Number(params.page ?? '1'),
  };
}

/**
 * Server-side data loading for a collection page (watchlist, watched):
 * redirects unauthenticated users to login, then prefetches the requested
 * page and both media-type counts into a dehydrated React Query state.
 */
export async function loadCollectionPageData({
  searchParams,
  keys,
  fetchPage,
  fetchCount,
}: CollectionPageDataOptions) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const { mediaType, page } = parseCollectionSearchParams(await searchParams);

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: keys.list(mediaType, page),
    queryFn: () => fetchPage(mediaType, page),
    staleTime: COLLECTION_STALE_TIME,
    gcTime: COLLECTION_GC_TIME,
  });

  for (const countMediaType of ['movie', 'tv'] as const) {
    await queryClient.prefetchQuery({
      queryKey: keys.count(countMediaType),
      queryFn: () => fetchCount(countMediaType),
      staleTime: COLLECTION_STALE_TIME,
      gcTime: COLLECTION_GC_TIME,
    });
  }

  return { dehydratedState: dehydrate(queryClient), userId: user.id };
}
