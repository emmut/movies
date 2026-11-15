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

type SystemListSearchParams = {
  mediaType?: string;
  page?: string;
  with_watch_providers?: string;
  watch_region?: string;
};

type ListFilterContext = Awaited<ReturnType<typeof getListFilterContext>>;

export type SystemListPageProps = {
  searchParams: Promise<SystemListSearchParams>;
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

  const context = await getListFilterContext(params);
  const { userRegion, availableWatchProviders } = context;

  const [watchProviders, queryClient] = await Promise.all([
    availableWatchProviders,
    prefetchSystemList(listType, params, user.id, context),
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

async function prefetchSystemList(
  listType: SystemListType,
  params: SystemListSearchParams,
  userId: string,
  context: ListFilterContext,
) {
  const { mediaType = 'movie', page = '1' } = params;
  const queryClient = getQueryClient();
  const requestHeaders = await headers();
  const api = createServerApi(requestHeaders);
  const queryUtils = createApiQueryUtils(api);
  const selectedRegion = context.activeRegion ?? context.userRegion;
  const input = {
    listType,
    resourceType: mediaType as 'movie' | 'tv',
    page: Number(page),
    providerIds: context.activeProviders ?? [],
    region: regionPreferenceSchema.shape.region.parse(selectedRegion),
  };
  const queryOptions = queryUtils.systemLists.page.queryOptions({ input });
  const queryKey = queryUtils.systemLists.page.queryKey({ input });

  await queryClient.prefetchQuery({
    ...queryOptions,
    queryKey: accountQueryKey(queryKey, userId),
  });
  return queryClient;
}
