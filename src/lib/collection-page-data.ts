import 'server-only';

import { dehydrate } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import { getUser } from '@/lib/auth-server';
import { getCollectionCount, getCollectionPage } from '@/lib/collections';
import {
  COLLECTION_GC_TIME,
  COLLECTION_STALE_TIME,
  CollectionKind,
} from '@/lib/collections-config';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

type CollectionSearchParams = Promise<{ mediaType?: string; page?: string }>;

/**
 * Server-side data loading for a collection page (watchlist, watched):
 * redirects unauthenticated users to login, then prefetches the requested
 * page and both media-type counts into a dehydrated React Query state.
 */
export async function loadCollectionPageData(
  collection: CollectionKind,
  searchParams: CollectionSearchParams,
) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const mediaType = (params.mediaType ?? 'movie') as 'movie' | 'tv';
  const page = Number(params.page ?? '1');

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.collections.list(collection, mediaType, page),
    queryFn: () => getCollectionPage(collection, mediaType, page),
    staleTime: COLLECTION_STALE_TIME,
    gcTime: COLLECTION_GC_TIME,
  });

  for (const countMediaType of ['movie', 'tv'] as const) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.collections.count(collection, countMediaType),
      queryFn: () => getCollectionCount(collection, countMediaType),
      staleTime: COLLECTION_STALE_TIME,
      gcTime: COLLECTION_GC_TIME,
    });
  }

  return { dehydratedState: dehydrate(queryClient), userId: user.id };
}
