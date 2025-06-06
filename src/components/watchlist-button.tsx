'use client';

import { Button } from '@/components/ui/button';
import { toggleWatchlist } from '@/lib/watchlist-actions';
import { Star } from 'lucide-react';
import { useOptimistic, useTransition } from 'react';

interface WatchlistButtonProps {
  movieId: number;
  isInWatchlist: boolean;
  userId?: string;
}

/**
 * Renders a button that allows the user to add or remove a movie from their watchlist with optimistic UI updates.
 *
 * The button displays the current watchlist status and provides instant feedback by updating the UI optimistically while the backend operation is in progress.
 *
 * @param movieId - The ID of the movie to toggle in the watchlist.
 * @param isInWatchlist - Indicates if the movie is currently in the user's watchlist.
 * @param userId - The ID of the user; if not provided, the button is not rendered.
 *
 * @returns The watchlist toggle button, or `null` if {@link userId} is not provided.
 */
export function WatchlistButton({
  movieId,
  isInWatchlist,
  userId,
}: WatchlistButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticInWatchlist, addOptimistic] = useOptimistic(isInWatchlist);

  if (!userId) {
    return null;
  }

  function handleToggleWatchlist() {
    startTransition(async () => {
      addOptimistic((prevOptimisticInWatchlist) => !prevOptimisticInWatchlist);
      try {
        await toggleWatchlist(movieId);
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
