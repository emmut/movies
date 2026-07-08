import { HydrationBoundary } from '@tanstack/react-query';

import { CollectionContent } from '@/components/collection-content';
import { loadCollectionPageData } from '@/lib/collection-page-data';

type WatchedPageProps = {
  searchParams: Promise<{
    mediaType?: string;
    page?: string;
  }>;
};

export default async function WatchedPage(props: WatchedPageProps) {
  const { dehydratedState, userId } = await loadCollectionPageData('watched', props.searchParams);

  return (
    <HydrationBoundary state={dehydratedState}>
      <CollectionContent collection="watched" userId={userId} />
    </HydrationBoundary>
  );
}
