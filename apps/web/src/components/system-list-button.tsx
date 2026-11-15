'use client';

import { useSystemListsToggleMutation } from '@movies/api/react/use-system-lists-query';
import { Button } from '@movies/ui/components/button';
import { cn } from 'cn';
import { CircleCheck, Eye, Star } from 'lucide-react';
import { ReactNode, useState } from 'react';

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

// Keep the optimistic value separate from the mutation-owned request state.
function usePendingToggle(isActive: boolean, isPending: boolean, toggle: () => Promise<void>) {
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
    try {
      await toggle();
    } catch (error) {
      setLocalIsActive(previous);
      console.error('Error toggling system list membership:', error);
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
  const toggleMutation = useSystemListsToggleMutation();
  const { isPending, localIsActive, handleToggle } = usePendingToggle(
    isActive,
    toggleMutation.isPending,
    async () => {
      await toggleMutation.mutateAsync({
        listType,
        resourceId,
        resourceType: resourceType === 'tv' ? 'tv' : 'movie',
      });
    },
  );

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
