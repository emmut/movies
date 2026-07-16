import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { notFound, redirect } from 'next/navigation';

import { getUser } from '@/lib/auth-server';
import { getListDetailsWithResources, getOwnedCustomList } from '@/lib/lists';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { getWatchProviderFilterContext } from '@/lib/watch-provider-filter-context';
import {
  activeWatchProviderFilter,
  loadWatchProviderSearchParams,
} from '@/lib/watch-provider-search-params';

import { ListDetailsContent } from './list-details-content';

// Covers nonexistent, foreign, and system lists (e.g. the watchlist) —
// without this, prefetchQuery swallows the throw and the client renders a
// skeleton forever.
async function assertOwnedCustomList(listId: string) {
  const list = await getOwnedCustomList(listId);
  if (!list) {
    notFound();
  }
}

/** Canonical URL for a list page, keeping an active provider filter intact. */
function canonicalListPageUrl(
  listId: string,
  page: number,
  watchProviders?: number[],
  watchRegion?: string,
) {
  const params = new URLSearchParams({ page: String(page) });
  if (watchProviders && watchRegion) {
    params.set('with_watch_providers', watchProviders.join(','));
    params.set('watch_region', watchRegion);
  }
  return `/lists/${listId}?${params.toString()}`;
}

export default async function ListDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; with_watch_providers?: string; watch_region?: string }>;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const search = await searchParams;
  const page = Number(search.page ?? '1');

  const { with_watch_providers, watch_region } = loadWatchProviderSearchParams(search);
  const { userRegion, availableWatchProviders } = await getWatchProviderFilterContext(watch_region);

  // Normalized exactly like the client content computes them, so the
  // prefetched query key matches after hydration.
  const { activeProviders, activeRegion } = activeWatchProviderFilter(
    with_watch_providers,
    userRegion,
  );

  await assertOwnedCustomList(id);

  // Prefetch list details with React Query for client-side caching
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.lists.detail(id, page, activeProviders, activeRegion),
    queryFn: async () => {
      const result = await getListDetailsWithResources(id, page, activeProviders, activeRegion);

      // If requested page is beyond the last, canonicalize the URL
      if (result.totalPages > 0 && page > result.totalPages) {
        redirect(canonicalListPageUrl(id, result.totalPages, activeProviders, activeRegion));
      }

      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Create a server action to fetch list details
  async function fetchListDetails(
    listId: string,
    page: number,
    watchProviders?: number[],
    watchRegion?: string,
  ) {
    'use server';
    return getListDetailsWithResources(listId, page, watchProviders, watchRegion);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ListDetailsContent
        listId={id}
        userId={user?.id}
        fetchListDetailsAction={fetchListDetails}
        watchProviders={availableWatchProviders}
        userRegion={userRegion}
      />
    </HydrationBoundary>
  );
}
