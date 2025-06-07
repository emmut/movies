'use client';

import { Button } from '@/components/ui/button';
import { toggleWatchlist } from '@/lib/watchlist-actions';
import { Star } from 'lucide-react';
import { useOptimistic, useTransition } from 'react';

interface WatchlistButtonProps {
  resourceId: number;
  resourceType: string;
  isInWatchlist: boolean;
  userId?: string;
}

/**
 * Renders a button that lets the user add or remove a resource from their watchlist with optimistic UI updates.
 *
 * The button reflects the current watchlist status and provides immediate feedback by updating the UI optimistically while the backend operation completes. If {@link userId} is not provided, nothing is rendered.
 *
 * @param resourceId - The unique identifier of the resource to toggle in the watchlist.
 * @param resourceType - The type of resource being toggled.
 * @param isInWatchlist - Whether the resource is initially in the user's watchlist.
 * @param userId - The user's identifier; if absent, the button is not rendered.
 *
 * @returns The watchlist toggle button, or `null` if {@link userId} is not provided.
 */
export function WatchlistButton({
  resourceId,
  resourceType,
  isInWatchlist,
  userId,
}: WatchlistButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticInWatchlist, addOptimistic] = useOptimistic(isInWatchlist);

  if (!userId) {
    return null;
  }

  /**
   * Initiates an optimistic toggle of the resource's watchlist status and updates the backend.
   *
   * Updates the UI immediately to reflect the toggled watchlist state, then asynchronously calls the backend to persist the change. Errors from the backend are logged but do not revert the optimistic UI update.
   */
  function handleToggleWatchlist() {
    startTransition(async () => {
      addOptimistic((prevOptimisticInWatchlist) => !prevOptimisticInWatchlist);
      try {
        await toggleWatchlist({
          resourceId,
          resourceType,
        });
      } catch (error) {
        console.error('Error updating watchlist:', error);
      }
    });
  }

  return (
    <Button
      onClick={handleToggleWatchlist}
      disabled={isPending}
      variant={optimisticInWatchlist ? 'default' : 'outline'}
      size="sm"
      className="gap-2"
    >
      <Star
        className={`h-4 w-4 ${optimisticInWatchlist ? 'fill-current' : ''}`}
      />
      {optimisticInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
    </Button>
  );
}
