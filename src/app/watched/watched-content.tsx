'use client';

import { CollectionContent, CollectionCopy } from '@/components/collection-content';
import { queryKeys } from '@/lib/query-keys';
import { getWatchedCount, getWatchedWithResourceDetailsPaginated } from '@/lib/watched';

const watchedCopy: CollectionCopy = {
  title: 'Watched',
  countVerb: 'watched',
  emptyTitle: (mediaLabel, isCollectionEmpty) =>
    isCollectionEmpty ? "You haven't watched anything yet" : `No ${mediaLabel} watched yet`,
  emptyHint: (mediaLabel, isCollectionEmpty) =>
    isCollectionEmpty
      ? `Mark ${mediaLabel} as watched from any detail page to track them here`
      : `Mark some ${mediaLabel} as watched to see them here`,
};

type WatchedContentProps = {
  userId?: string;
};

export function WatchedContent({ userId }: WatchedContentProps) {
  return (
    <CollectionContent
      userId={userId}
      copy={watchedCopy}
      pageType="watched"
      keys={queryKeys.watched}
      fetchPage={getWatchedWithResourceDetailsPaginated}
      fetchCount={getWatchedCount}
    />
  );
}
