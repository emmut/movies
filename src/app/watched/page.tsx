import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import { getUser } from '@/lib/auth-server';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { getWatchedCount, getWatchedWithResourceDetailsPaginated } from '@/lib/watched';

import { WatchedContent } from './watched-content';

type WatchedPageProps = {
  searchParams: Promise<{
    mediaType?: string;
    page?: string;
  }>;
};

/**
 * Displays the user's watched history page, allowing filtering between watched movies and TV shows.
 *
 * Redirects unauthenticated users to the login page. Shows a grid of watched items for the selected media type, or an empty state with a prompt to explore if no items are present.
 */
export default async function WatchedPage(props: WatchedPageProps) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const mediaType = (searchParams.mediaType ?? 'movie') as 'movie' | 'tv';
  const page = Number(searchParams.page ?? '1');

  // Prefetch watched data with React Query for client-side caching
  const queryClient = getQueryClient();

  // Prefetch current page data
  await queryClient.prefetchQuery({
    queryKey: queryKeys.watched.list(mediaType, page),
    queryFn: () => getWatchedWithResourceDetailsPaginated(mediaType, page),
    staleTime: 1000 * 60 * 5, // 5 minutes - watched history changes less frequently
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Prefetch movie count
  await queryClient.prefetchQuery({
    queryKey: queryKeys.watched.count('movie'),
    queryFn: () => getWatchedCount('movie'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Prefetch TV count
  await queryClient.prefetchQuery({
    queryKey: queryKeys.watched.count('tv'),
    queryFn: () => getWatchedCount('tv'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WatchedContent userId={user?.id} />
    </HydrationBoundary>
  );
}
