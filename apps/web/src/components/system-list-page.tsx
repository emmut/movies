import { accountQueryKey } from '@movies/api/account-query-key';
import { regionPreferenceSchema } from '@movies/api/preferences';
import { createApiQueryUtils } from '@movies/api/query-utils';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { SystemListContent } from '@/components/system-list-content';
import { createServerApi } from '@/lib/api-server';
import { getUser } from '@/lib/auth-server';
import { getQueryClient } from '@/lib/query-client';
import type { SystemListType } from '@/lib/validations';
import { getListFilterContext } from '@/lib/watch-provider-filter-context';

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

  const { userRegion, availableWatchProviders, activeProviders, activeRegion } =
    await getListFilterContext(params);

  const queryClient = getQueryClient();

  const api = createApiQueryUtils(createServerApi(await headers()));
  const input = {
    listType,
    resourceType: mediaType,
    page,
    providerIds: activeProviders ?? [],
    region: regionPreferenceSchema.shape.region.parse(activeRegion ?? userRegion),
  };
  const [watchProviders] = await Promise.all([
    availableWatchProviders,
    queryClient.prefetchQuery({
      ...api.systemLists.page.queryOptions({ input }),
      queryKey: accountQueryKey(api.systemLists.page.queryKey({ input }), user.id),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SystemListContent
        listType={listType}
        userId={user.id}
        watchProviders={watchProviders}
        userRegion={userRegion}
      />
    </HydrationBoundary>
  );
}
