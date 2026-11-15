import { accountQueryKey } from '@movies/api/account-query-key';
import { hasErrorCode } from '@movies/api/errors';
import { regionPreferenceSchema } from '@movies/api/preferences';
import { createApiQueryUtils } from '@movies/api/query-utils';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { createServerApi } from '@/lib/api-server';
import { getUser } from '@/lib/auth-server';
import { getQueryClient } from '@/lib/query-client';
import { getListFilterContext } from '@/lib/watch-provider-filter-context';

import { ListDetailsContent } from './list-details-content';

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

  const { userRegion, availableWatchProviders, activeProviders, activeRegion } =
    await getListFilterContext(search);

  const queryClient = getQueryClient();

  const api = createApiQueryUtils(createServerApi(await headers()));
  const input = {
    listId: id,
    page,
    providerIds: activeProviders ?? [],
    region: regionPreferenceSchema.shape.region.parse(activeRegion ?? userRegion),
  };
  const options = {
    ...api.customLists.details.queryOptions({ input }),
    queryKey: accountQueryKey(api.customLists.details.queryKey({ input }), user.id),
  };
  const result = await queryClient.fetchQuery(options).catch((error: unknown) => {
    if (hasErrorCode(error, 'NOT_FOUND')) {
      notFound();
    }
    throw error;
  });
  if (result.currentPage !== page) {
    redirect(canonicalListPageUrl(id, result.currentPage, activeProviders, activeRegion));
  }
  const watchProviders = await availableWatchProviders;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ListDetailsContent
        listId={id}
        userId={user.id}
        watchProviders={watchProviders}
        userRegion={userRegion}
      />
    </HydrationBoundary>
  );
}
