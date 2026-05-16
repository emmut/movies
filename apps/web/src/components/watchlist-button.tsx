
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@movies/ui/components/button';
import { queryKeys } from '@movies/api/lib/query-keys';
import { toggleWatchlist } from '@movies/api/lib/watchlist';

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
  const [isPending, setIsPending] = useState(false);
  const [localIsInWatchlist, setLocalIsInWatchlist] = useState(isInWatchlist);
  const queryClient = useQueryClient();

  useEffect(() => {
    setLocalIsInWatchlist(isInWatchlist);
  }, [isInWatchlist]);

  if (!userId) {
    return null;
  }

  async function handleToggleWatchlist() {
    if (isPending) {
      return;
    }
    const previous = localIsInWatchlist;
    setLocalIsInWatchlist((prev) => !prev);
    setIsPending(true);
    try {
      await toggleWatchlist({ resourceId, resourceType });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
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
