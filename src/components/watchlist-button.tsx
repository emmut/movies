'use client';

import { Star } from 'lucide-react';

import { CollectionToggleButton } from '@/components/collection-toggle-button';
import { queryKeys } from '@/lib/query-keys';
import { toggleWatchlist } from '@/lib/watchlist-actions';

interface WatchlistButtonProps {
  resourceId: number;
  resourceType: string;
  isInWatchlist: boolean;
  userId?: string;
  className?: string;
}

export function WatchlistButton({
  resourceId,
  resourceType,
  isInWatchlist,
  userId,
  className,
}: WatchlistButtonProps) {
  return (
    <CollectionToggleButton
      resourceId={resourceId}
      resourceType={resourceType}
      isActive={isInWatchlist}
      userId={userId}
      className={className}
      action={toggleWatchlist}
      invalidateKey={queryKeys.watchlist.all}
      active={{
        icon: <Star className="h-4 w-4 fill-current" />,
        label: 'In Watchlist',
        ariaLabel: 'Remove from Watchlist',
      }}
      inactive={{
        icon: <Star className="h-4 w-4" />,
        label: 'Add to Watchlist',
        ariaLabel: 'Add to Watchlist',
      }}
    />
  );
}
