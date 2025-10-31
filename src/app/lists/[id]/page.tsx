import { getUser } from '@/lib/auth-server';
import { getListDetailsWithResources } from '@/lib/lists';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { ListDetailsContent } from './list-details-content';

export default async function ListDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? '1');

  // Prefetch list details with React Query for client-side caching
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.lists.detail(id, page),
    queryFn: async () => {
      const result = await getListDetailsWithResources(id, page);

      // If requested page is beyond the last, canonicalize the URL
      if (result.totalPages > 0 && page > result.totalPages) {
        redirect(`/lists/${id}?page=${result.totalPages}`);
      }

      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Create a server action to fetch list details
  async function fetchListDetails(listId: string, page: number) {
    'use server';
    return getListDetailsWithResources(listId, page);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ListDetailsContent
        listId={id}
        userId={user?.id}
        fetchListDetails={fetchListDetails}
      />
    </HydrationBoundary>
  );
}
