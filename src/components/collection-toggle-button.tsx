'use client';

import { useQueryClient } from '@tanstack/react-query';
import { CircleCheck, Eye, Star } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { toggleCollection } from '@/lib/collection-actions';
import { CollectionKind } from '@/lib/collections-config';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

type ToggleView = {
  icon: ReactNode;
  label: string;
  ariaLabel: string;
};

const TOGGLE_VIEWS: Record<CollectionKind, { active: ToggleView; inactive: ToggleView }> = {
  watchlist: {
    active: {
      icon: <Star className="h-4 w-4 fill-current" />,
      label: 'In Watchlist',
      ariaLabel: 'Remove from Watchlist',
    },
    inactive: {
      icon: <Star className="h-4 w-4" />,
      label: 'Add to Watchlist',
      ariaLabel: 'Add to Watchlist',
    },
  },
  watched: {
    active: {
      icon: <CircleCheck className="h-4 w-4" />,
      label: 'Watched',
      ariaLabel: 'Mark as not watched',
    },
    inactive: {
      icon: <Eye className="h-4 w-4" />,
      label: 'Mark as Watched',
      ariaLabel: 'Mark as watched',
    },
  },
};

type CollectionToggleButtonProps = {
  collection: CollectionKind;
  resourceId: number;
  resourceType: string;
  isActive: boolean;
  userId?: string;
  className?: string;
};

// Not useOptimistic/useTransition: the toggle's revalidatePath makes Next
// intermittently never settle the transition, wedging isPending at true and
// the button disabled (https://github.com/vercel/next.js/discussions/82289).
// Manual pending state with a finally block cannot wedge.
function useOptimisticToggle(isActive: boolean, toggle: () => Promise<void>) {
  const [isPending, setIsPending] = useState(false);
  const [localIsActive, setLocalIsActive] = useState(isActive);
  const [prevIsActive, setPrevIsActive] = useState(isActive);

  // Render-time reset when the server-rendered prop changes — the React-docs
  // replacement for syncing props into state with an effect.
  if (prevIsActive !== isActive) {
    setPrevIsActive(isActive);
    setLocalIsActive(isActive);
  }

  async function handleToggle() {
    if (isPending) {
      return;
    }
    const previous = localIsActive;
    setLocalIsActive(!previous);
    setIsPending(true);
    try {
      await toggle();
    } catch (error) {
      setLocalIsActive(previous);
      console.error('Error toggling collection membership:', error);
    } finally {
      setIsPending(false);
    }
  }

  return { isPending, localIsActive, handleToggle };
}

/**
 * Both labels are always rendered, stacked in the same grid cell, so the
 * button keeps the width of its widest label and doesn't shift on toggle.
 */
function StackedLabels({ current, other }: { current: string; other: string }) {
  return (
    <div className="grid grid-cols-1 grid-rows-1 place-items-center">
      <span className="visible col-start-1 row-start-1">{current}</span>
      <span className="invisible col-start-1 row-start-1">{other}</span>
    </div>
  );
}

/**
 * Toggle button for a user collection (watchlist, watched). Optimistically
 * flips its state, calls the toggle action, and invalidates the collection's
 * React Query cache; rolls back on failure. Hidden for anonymous visitors.
 */
export function CollectionToggleButton({
  collection,
  resourceId,
  resourceType,
  isActive,
  userId,
  className,
}: CollectionToggleButtonProps) {
  const queryClient = useQueryClient();
  const { isPending, localIsActive, handleToggle } = useOptimisticToggle(isActive, async () => {
    await toggleCollection({ collection, resourceId, resourceType });
    void queryClient.invalidateQueries({ queryKey: queryKeys.collections.kind(collection) });
  });

  if (!userId) {
    return null;
  }

  const views = TOGGLE_VIEWS[collection];
  const [current, other] = localIsActive ? [views.active, views.inactive] : [views.inactive, views.active];

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant={localIsActive ? 'default' : 'outline'}
      className={cn('gap-2 px-3 py-1', className)}
      aria-label={current.ariaLabel}
    >
      {current.icon}
      <StackedLabels current={current.label} other={other.label} />
    </Button>
  );
}
