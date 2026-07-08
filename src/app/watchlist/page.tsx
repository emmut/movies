import { HydrationBoundary } from '@tanstack/react-query';

import { CollectionContent } from '@/components/collection-content';
import { loadCollectionPageData } from '@/lib/collection-page-data';

type WatchlistPageProps = {
  searchParams: Promise<{
    mediaType?: string;
    page?: string;
  }>;
};

export default async function WatchlistPage(props: WatchlistPageProps) {
  const { dehydratedState, userId } = await loadCollectionPageData('watchlist', props.searchParams);

  return (
    <HydrationBoundary state={dehydratedState}>
      <CollectionContent collection="watchlist" userId={userId} />
    </HydrationBoundary>
  );
}
