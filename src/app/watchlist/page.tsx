import { HydrationBoundary } from '@tanstack/react-query';

import { loadCollectionPageData } from '@/lib/collection-page-data';
import { queryKeys } from '@/lib/query-keys';
import { getWatchlistCount, getWatchlistWithResourceDetailsPaginated } from '@/lib/watchlist';

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
 */
export default async function WatchlistPage(props: WatchlistPageProps) {
  const { dehydratedState, userId } = await loadCollectionPageData({
    searchParams: props.searchParams,
    keys: queryKeys.watchlist,
    fetchPage: getWatchlistWithResourceDetailsPaginated,
    fetchCount: getWatchlistCount,
  });

  return (
    <HydrationBoundary state={dehydratedState}>
      <WatchlistContent userId={userId} />
    </HydrationBoundary>
  );
}
