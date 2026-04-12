import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { getUser } from '@/lib/auth-server';
import { getListDetailsWithResources } from '@/lib/lists';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { ListDetailsContent } from '../lists/[id]/list-details-content';

const fetchListDetails = createServerFn()
  .inputValidator((data: { listId: string; page: number }) => data)
  .handler(async ({ data }) => {
    return getListDetailsWithResources(data.listId, data.page);
  });

export const Route = createFileRoute('/lists/$id')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
  }),
  beforeLoad: async () => {
    const user = await getUser();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    return { user };
  },
  loader: async ({ context, params, search }) => {
    const { user } = context;
    const { id } = params;
    const { page } = search;

    const queryClient = getQueryClient();

    await queryClient.prefetchQuery({
      queryKey: queryKeys.lists.detail(id, page),
      queryFn: async () => {
        const result = await fetchListDetails({ data: { listId: id, page } });
        if (result.totalPages > 0 && page > result.totalPages) {
          throw redirect({ to: '/lists/$id', params: { id }, search: { page: result.totalPages } });
        }
        return result;
      },
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    });

    return { dehydratedState: dehydrate(queryClient), listId: id, userId: user.id };
  },
  component: ListDetailsPage,
});

function ListDetailsPage() {
  const { dehydratedState, listId, userId } = Route.useLoaderData();

  return (
    <HydrationBoundary state={dehydratedState}>
      <ListDetailsContent
        listId={listId}
        userId={userId}
        fetchListDetailsAction={(listId, page) => fetchListDetails({ data: { listId, page } })}
      />
    </HydrationBoundary>
  );
}
