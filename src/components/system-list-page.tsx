import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import { SYSTEM_LIST_QUERY_TIMES, SystemListContent } from '@/components/system-list-content';
import { getUser } from '@/lib/auth-server';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import {
  getSystemListCount,
  getSystemListWithResourceDetailsPaginated,
} from '@/lib/system-list-queries';
import type { SystemListType } from '@/lib/validations';
import { getWatchProviderFilterContext } from '@/lib/watch-provider-filter-context';
import {
  activeWatchProviderFilter,
  loadWatchProviderSearchParams,
} from '@/lib/watch-provider-search-params';

export type SystemListPageProps = {
  searchParams: Promise<{
    mediaType?: string;
    page?: string;
    with_watch_providers?: string;
    watch_region?: string;
  }>;
};

/**
 * Server shell for a system list page (watchlist, watched): redirects
 * unauthenticated users to the login page, prefetches the current page and
 * both media-type counts into React Query, and hydrates the client content.
 */
export async function SystemListPage({
  listType,
  searchParams,
}: SystemListPageProps & { listType: SystemListType }) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const mediaType = (params.mediaType ?? 'movie') as 'movie' | 'tv';
  const page = Number(params.page ?? '1');

  const { with_watch_providers, watch_region } = loadWatchProviderSearchParams(params);
  const { userRegion, availableWatchProviders } = await getWatchProviderFilterContext(watch_region);

  // Normalized exactly like the client content computes them, so the
  // prefetched query key matches after hydration.
  const { activeProviders, activeRegion } = activeWatchProviderFilter(
    with_watch_providers,
    userRegion,
  );

  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys[listType].list(mediaType, page, activeProviders, activeRegion),
      queryFn: () =>
        getSystemListWithResourceDetailsPaginated(
          listType,
          mediaType,
          page,
          activeProviders,
          activeRegion,
        ),
      ...SYSTEM_LIST_QUERY_TIMES,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys[listType].count('movie'),
      queryFn: () => getSystemListCount(listType, 'movie'),
      ...SYSTEM_LIST_QUERY_TIMES,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys[listType].count('tv'),
      queryFn: () => getSystemListCount(listType, 'tv'),
      ...SYSTEM_LIST_QUERY_TIMES,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SystemListContent
        listType={listType}
        userId={user.id}
        watchProviders={availableWatchProviders}
        userRegion={userRegion}
      />
    </HydrationBoundary>
  );
}
