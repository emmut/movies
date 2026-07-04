'use client';

import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Star } from 'lucide-react';
import { useState } from 'react';

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
  // Not useOptimistic/useTransition: the toggle's revalidatePath makes Next
  // intermittently never settle the transition, wedging isPending at true and
  // the button disabled (https://github.com/vercel/next.js/discussions/82289).
  // Manual pending state with a finally block cannot wedge.
  const [isPending, setIsPending] = useState(false);
  const [localIsInWatchlist, setLocalIsInWatchlist] = useState(isInWatchlist);
  const [prevIsInWatchlist, setPrevIsInWatchlist] = useState(isInWatchlist);
  const queryClient = useQueryClient();

  // Render-time reset when the server-rendered prop changes — the React-docs
  // replacement for syncing props into state with an effect.
  if (prevIsInWatchlist !== isInWatchlist) {
    setPrevIsInWatchlist(isInWatchlist);
    setLocalIsInWatchlist(isInWatchlist);
  }

  if (!userId) {
    return null;
  }

  async function handleToggleWatchlist() {
    if (isPending) {
      return;
    }
    const previous = localIsInWatchlist;
    setLocalIsInWatchlist(!previous);
    setIsPending(true);
    try {
      await toggleWatchlist({ resourceId, resourceType });
      void queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
    } catch (error) {
      setLocalIsInWatchlist(previous);
      console.error('Error updating watchlist:', error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      onClick={handleToggleWatchlist}
      disabled={isPending}
      variant={localIsInWatchlist ? 'default' : 'outline'}
      className="gap-2 px-3 py-1"
      aria-label={localIsInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
    >
      <Star className={`h-4 w-4 ${localIsInWatchlist ? 'fill-current' : ''}`} />

      <div className="grid grid-cols-1 grid-rows-1 place-items-center">
        <span
          className={clsx(localIsInWatchlist ? 'visible' : 'invisible', 'col-start-1 row-start-1')}
        >
          In Watchlist
        </span>
        <span
          className={clsx(localIsInWatchlist ? 'invisible' : 'visible', 'col-start-1 row-start-1')}
        >
          Add to Watchlist
        </span>
      </div>
    </Button>
  );
}
