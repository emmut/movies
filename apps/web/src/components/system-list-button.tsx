'use client';

import { Button } from '@movies/ui/components/button';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from 'cn';
import { CircleCheck, Eye, Star } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { queryKeys } from '@/lib/query-keys';
import { toggleSystemListItem } from '@/lib/system-list-actions';
import type { SystemListType } from '@/lib/validations';

const BUTTON_COPY: Record<
  SystemListType,
  {
    activeIcon: ReactNode;
    inactiveIcon: ReactNode;
    label: string;
    activeAriaLabel: string;
    inactiveAriaLabel: string;
  }
> = {
  watchlist: {
    activeIcon: <Star className="size-4 fill-current" aria-hidden="true" />,
    inactiveIcon: <Star className="size-4" aria-hidden="true" />,
    label: 'Watchlist',
    activeAriaLabel: 'Remove from Watchlist',
    inactiveAriaLabel: 'Add to Watchlist',
  },
  watched: {
    activeIcon: <CircleCheck className="size-4" aria-hidden="true" />,
    inactiveIcon: <Eye className="size-4" aria-hidden="true" />,
    label: 'Watched',
    activeAriaLabel: 'Mark as not watched',
    inactiveAriaLabel: 'Mark as watched',
  },
};

// Not useOptimistic/useTransition: the toggle's revalidatePath makes Next
// intermittently never settle the transition, wedging isPending at true and
// the button disabled (https://github.com/vercel/next.js/discussions/82289).
// Manual pending state with a finally block cannot wedge.
function usePendingToggle(isActive: boolean, toggle: () => Promise<void>) {
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
      console.error('Error toggling system list membership:', error);
    } finally {
      setIsPending(false);
    }
  }

  return { isPending, localIsActive, handleToggle };
}

interface SystemListButtonProps {
  listType: SystemListType;
  resourceId: number;
  resourceType: string;
  isActive: boolean;
  userId?: string;
  className?: string;
}

/**
 * Toggle button for the per-user system lists (watchlist, watched).
 * Optimistically flips its state, calls the server action, and invalidates
 * the affected React Query caches; rolls back on failure.
 */
export function SystemListButton({
  listType,
  resourceId,
  resourceType,
  isActive,
  userId,
  className,
}: SystemListButtonProps) {
  const queryClient = useQueryClient();
  const { isPending, localIsActive, handleToggle } = usePendingToggle(isActive, async () => {
    await toggleSystemListItem({ listType, resourceId, resourceType });
    void queryClient.invalidateQueries({ queryKey: queryKeys[listType].all });
  });

  if (!userId) {
    return null;
  }

  const copy = BUTTON_COPY[listType];
  const [icon, ariaLabel] = localIsActive
    ? [copy.activeIcon, copy.activeAriaLabel]
    : [copy.inactiveIcon, copy.inactiveAriaLabel];

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant={localIsActive ? 'default' : 'outline'}
      className={cn('h-11 gap-2 px-3 sm:h-10', className)}
      aria-label={ariaLabel}
      aria-pressed={localIsActive}
      title={ariaLabel}
    >
      {icon}
      {copy.label}
    </Button>
  );
}
