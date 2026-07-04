'use client';

import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Star } from 'lucide-react';
import { useOptimistic, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/query-keys';
import { toggleWatchlist } from '@/lib/watchlist-actions';

interface WatchlistButtonProps {
  resourceId: number;
  resourceType: string;
  isInWatchlist: boolean;
  userId?: string;
}

export function WatchlistButton({
  resourceId,
  resourceType,
  isInWatchlist,
  userId,
}: WatchlistButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticIsInWatchlist, setOptimisticIsInWatchlist] = useOptimistic(isInWatchlist);
  const queryClient = useQueryClient();

  if (!userId) {
    return null;
  }

  function handleToggleWatchlist() {
    if (isPending) {
      return;
    }
    startTransition(async () => {
      setOptimisticIsInWatchlist(!optimisticIsInWatchlist);
      try {
        await toggleWatchlist({ resourceId, resourceType });
        queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
      } catch (error) {
        // useOptimistic reverts to the isInWatchlist prop when the transition ends.
        console.error('Error updating watchlist:', error);
      }
    });
  }

  return (
    <Button
      onClick={handleToggleWatchlist}
      disabled={isPending}
      variant={optimisticIsInWatchlist ? 'default' : 'outline'}
      className="gap-2 px-3 py-1"
      aria-label={optimisticIsInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
    >
      <Star className={`h-4 w-4 ${optimisticIsInWatchlist ? 'fill-current' : ''}`} />

      <div className="grid grid-cols-1 grid-rows-1 place-items-center">
        <span
          className={clsx(optimisticIsInWatchlist ? 'visible' : 'invisible', 'col-start-1 row-start-1')}
        >
          In Watchlist
        </span>
        <span
          className={clsx(optimisticIsInWatchlist ? 'invisible' : 'visible', 'col-start-1 row-start-1')}
        >
          Add to Watchlist
        </span>
      </div>
    </Button>
  );
}
