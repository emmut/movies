'use client';

import { CircleCheck, Eye } from 'lucide-react';

import { CollectionToggleButton } from '@/components/collection-toggle-button';
import { queryKeys } from '@/lib/query-keys';
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
  return (
    <CollectionToggleButton
      resourceId={resourceId}
      resourceType={resourceType}
      isActive={isWatched}
      userId={userId}
      className={className}
      action={toggleWatched}
      invalidateKey={queryKeys.watched.all}
      active={{
        icon: <CircleCheck className="h-4 w-4" />,
        label: 'Watched',
        ariaLabel: 'Mark as not watched',
      }}
      inactive={{
        icon: <Eye className="h-4 w-4" />,
        label: 'Mark as Watched',
        ariaLabel: 'Mark as watched',
      }}
    />
  );
}
