import { HydrationBoundary } from '@tanstack/react-query';

import { loadCollectionPageData } from '@/lib/collection-page-data';
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
  const { dehydratedState, userId } = await loadCollectionPageData({
    searchParams: props.searchParams,
    keys: queryKeys.watched,
    fetchPage: getWatchedWithResourceDetailsPaginated,
    fetchCount: getWatchedCount,
  });

  return (
    <HydrationBoundary state={dehydratedState}>
      <WatchedContent userId={userId} />
    </HydrationBoundary>
  );
}
