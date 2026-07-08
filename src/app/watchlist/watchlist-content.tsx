'use client';

import { CollectionContent, CollectionCopy } from '@/components/collection-content';
import { queryKeys } from '@/lib/query-keys';
import { getWatchlistCount, getWatchlistWithResourceDetailsPaginated } from '@/lib/watchlist';

const watchlistCopy: CollectionCopy = {
  title: 'My Watchlist',
  countVerb: 'saved',
  emptyTitle: (mediaLabel, isCollectionEmpty) =>
    isCollectionEmpty ? 'Your watchlist is empty' : `No ${mediaLabel} in your watchlist`,
  emptyHint: (mediaLabel, isCollectionEmpty) =>
    isCollectionEmpty
      ? `Start adding ${mediaLabel} by clicking the star on any detail page`
      : `Add some ${mediaLabel} to see them here`,
};

type WatchlistContentProps = {
  userId?: string;
};

export function WatchlistContent({ userId }: WatchlistContentProps) {
  return (
    <CollectionContent
      userId={userId}
      copy={watchlistCopy}
      pageType="watchlist"
      keys={queryKeys.watchlist}
      fetchPage={getWatchlistWithResourceDetailsPaginated}
      fetchCount={getWatchlistCount}
    />
  );
}
