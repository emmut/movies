import { getUser } from '@/lib/auth-server';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import {
  getWatchlistCount,
  getWatchlistWithResourceDetailsPaginated,
} from '@/lib/watchlist';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { WatchlistContent } from './watchlist-content';

type WatchlistPageProps = {
  searchParams: Promise<{
    mediaType?: string;
    page?: string;
  }>;
};

/**
 * Displays the user's watchlist page, allowing filtering between saved movies and TV shows.
 *
 * Redirects unauthenticated users to the login page. Shows a grid of saved items for the selected media type, or an empty state with a prompt to explore if no items are present.
 *
 * @param props - Contains a promise resolving to search parameters, including the selected media type.
 * @returns The JSX for the watchlist page, with dynamic content based on authentication, media type selection, and saved items.
 */
export default async function WatchlistPage(props: WatchlistPageProps) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const mediaType = (searchParams.mediaType ?? 'movie') as 'movie' | 'tv';
  const page = Number(searchParams.page ?? '1');

  // Prefetch watchlist data with React Query for client-side caching
  const queryClient = getQueryClient();

  // Prefetch current page data
  await queryClient.prefetchQuery({
    queryKey: queryKeys.watchlist.list(mediaType, page),
    queryFn: () => getWatchlistWithResourceDetailsPaginated(mediaType, page),
    staleTime: 1000 * 60 * 5, // 5 minutes - watchlist changes less frequently
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Prefetch movie count
  await queryClient.prefetchQuery({
    queryKey: queryKeys.watchlist.count('movie'),
    queryFn: () => getWatchlistCount('movie'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Prefetch TV count
  await queryClient.prefetchQuery({
    queryKey: queryKeys.watchlist.count('tv'),
    queryFn: () => getWatchlistCount('tv'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WatchlistContent userId={user?.id} />
    </HydrationBoundary>
  );
}
