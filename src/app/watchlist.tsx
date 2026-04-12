import { createFileRoute, redirect } from '@tanstack/react-router';

import { getUser } from '@/lib/auth-server';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { getWatchlistCount, getWatchlistWithResourceDetailsPaginated } from '@/lib/watchlist';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { WatchlistContent } from './watchlist/watchlist-content';

export const Route = createFileRoute('/watchlist')({
  validateSearch: (search: Record<string, unknown>) => ({
    mediaType: (search.mediaType as 'movie' | 'tv') ?? 'movie',
    page: Number(search.page ?? 1),
  }),
  beforeLoad: async () => {
    const user = await getUser();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    return { user };
  },
  loader: async ({ context, search }) => {
    const { user } = context;
    const { mediaType, page } = search;

    const queryClient = getQueryClient();

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.watchlist.list(mediaType, page),
        queryFn: () => getWatchlistWithResourceDetailsPaginated(mediaType, page),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.watchlist.count('movie'),
        queryFn: () => getWatchlistCount('movie'),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.watchlist.count('tv'),
        queryFn: () => getWatchlistCount('tv'),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
      }),
    ]);

    return { dehydratedState: dehydrate(queryClient), userId: user.id };
  },
  component: WatchlistPage,
});

function WatchlistPage() {
  const { dehydratedState, userId } = Route.useLoaderData();

  return (
    <HydrationBoundary state={dehydratedState}>
      <WatchlistContent userId={userId} />
    </HydrationBoundary>
  );
}
