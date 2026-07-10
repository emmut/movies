'use client';

import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { CircleCheck, Eye } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { toggleWatched } from '@/lib/watched-actions';

interface WatchedButtonProps {
  resourceId: number;
  resourceType: string;
  isWatched: boolean;
  userId?: string;
  className?: string;
}

export function WatchedButton({
  resourceId,
  resourceType,
  isWatched,
  userId,
  className,
}: WatchedButtonProps) {
  // Not useOptimistic/useTransition: the toggle's revalidatePath makes Next
  // intermittently never settle the transition, wedging isPending at true and
  // the button disabled (https://github.com/vercel/next.js/discussions/82289).
  // Manual pending state with a finally block cannot wedge.
  const [isPending, setIsPending] = useState(false);
  const [localIsWatched, setLocalIsWatched] = useState(isWatched);
  const [prevIsWatched, setPrevIsWatched] = useState(isWatched);
  const queryClient = useQueryClient();

  // Render-time reset when the server-rendered prop changes — the React-docs
  // replacement for syncing props into state with an effect.
  if (prevIsWatched !== isWatched) {
    setPrevIsWatched(isWatched);
    setLocalIsWatched(isWatched);
  }

  if (!userId) {
    return null;
  }

  async function handleToggleWatched() {
    if (isPending) {
      return;
    }
    const previous = localIsWatched;
    setLocalIsWatched(!previous);
    setIsPending(true);
    try {
      await toggleWatched({ resourceId, resourceType });
      void queryClient.invalidateQueries({ queryKey: queryKeys.watched.all });
    } catch (error) {
      setLocalIsWatched(previous);
      console.error('Error updating watched history:', error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      onClick={handleToggleWatched}
      disabled={isPending}
      variant={localIsWatched ? 'default' : 'outline'}
      className={cn('gap-2 px-3 py-1', className)}
      aria-label={localIsWatched ? 'Mark as not watched' : 'Mark as watched'}
    >
      {localIsWatched ? <CircleCheck className="h-4 w-4" /> : <Eye className="h-4 w-4" />}

      <div className="grid grid-cols-1 grid-rows-1 place-items-center">
        <span className={clsx(localIsWatched ? 'visible' : 'invisible', 'col-start-1 row-start-1')}>
          Watched
        </span>
        <span className={clsx(localIsWatched ? 'invisible' : 'visible', 'col-start-1 row-start-1')}>
          Mark as Watched
        </span>
      </div>
    </Button>
  );
}
