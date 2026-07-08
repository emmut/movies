'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ToggleAction = (params: { resourceId: number; resourceType: string }) => Promise<unknown>;

type CollectionToggleState = {
  icon: ReactNode;
  label: string;
  ariaLabel: string;
};

export type CollectionToggleButtonProps = {
  resourceId: number;
  resourceType: string;
  isActive: boolean;
  userId?: string;
  className?: string;
  action: ToggleAction;
  invalidateKey: readonly unknown[];
  active: CollectionToggleState;
  inactive: CollectionToggleState;
};

// Not useOptimistic/useTransition: the toggle's revalidatePath makes Next
// intermittently never settle the transition, wedging isPending at true and
// the button disabled (https://github.com/vercel/next.js/discussions/82289).
// Manual pending state with a finally block cannot wedge.
function useCollectionToggle(isActive: boolean, toggle: () => Promise<void>) {
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
 * Toggle button for per-user resource collections (watchlist, watched).
 * Optimistically flips its state, calls the server action, and invalidates
 * the collection's React Query cache; rolls back on failure.
 */
export function CollectionToggleButton({
  resourceId,
  resourceType,
  isActive,
  userId,
  className,
  action,
  invalidateKey,
  active,
  inactive,
}: CollectionToggleButtonProps) {
  const queryClient = useQueryClient();
  const { isPending, localIsActive, handleToggle } = useCollectionToggle(isActive, async () => {
    await action({ resourceId, resourceType });
    void queryClient.invalidateQueries({ queryKey: invalidateKey });
  });

  if (!userId) {
    return null;
  }

  const [current, other] = localIsActive ? [active, inactive] : [inactive, active];

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
