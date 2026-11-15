import { createApiQueryUtils } from '@movies/api/query-utils';
import { searchInput } from '@movies/api/search';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { headers } from 'next/headers';

import { createServerApi } from '@/lib/api-server';
import { getUser } from '@/lib/auth-server';
import { getQueryClient } from '@/lib/query-client';

import { SearchContent } from './search-content';

type SearchPageProps = {
  searchParams: Promise<{ q?: string; page?: string; mediaType?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const input = searchInput.safeParse({
    query: params.q,
    page: Number(params.page ?? 1),
    type: params.mediaType ?? 'all',
  });
  const user = await getUser();
  const queryClient = getQueryClient();
  if (input.success) {
    const api = createApiQueryUtils(createServerApi(await headers()));
    await queryClient.prefetchQuery(api.search.list.queryOptions({ input: input.data }));
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchContent userId={user?.id} />
    </HydrationBoundary>
  );
}
