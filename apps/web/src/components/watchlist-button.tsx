import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@movies/ui/components/button';
import { cn } from '@movies/ui/lib/utils';
import { queryKeys } from '@movies/api/lib/query-keys';
import { orpc } from '@/utils/orpc';

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
  const [localIsInWatchlist, setLocalIsInWatchlist] = useState(isInWatchlist);
  const queryClient = useQueryClient();

  useEffect(() => {
    setLocalIsInWatchlist(isInWatchlist);
  }, [isInWatchlist]);

  const toggle = useMutation(
    orpc.watchlist.toggle.mutationOptions({
      onMutate: () => {
        setLocalIsInWatchlist((prev) => !prev);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
      },
      onError: () => {
        setLocalIsInWatchlist(isInWatchlist);
      },
    }),
  );

  if (!userId) {
    return null;
  }

  return (
    <Button
      onClick={() => toggle.mutate({ resourceId, resourceType })}
      disabled={toggle.isPending}
      variant={localIsInWatchlist ? 'default' : 'outline'}
      className="gap-2 px-3 py-1"
      aria-label={localIsInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
    >
      <Star className={`h-4 w-4 ${localIsInWatchlist ? 'fill-current' : ''}`} />

      <div className="grid grid-cols-1 grid-rows-1 place-items-center">
        <span className={cn(localIsInWatchlist ? 'visible' : 'invisible', 'col-start-1 row-start-1')}>
          In Watchlist
        </span>
        <span className={cn(localIsInWatchlist ? 'invisible' : 'visible', 'col-start-1 row-start-1')}>
          Add to Watchlist
        </span>
      </div>
    </Button>
  );
}
