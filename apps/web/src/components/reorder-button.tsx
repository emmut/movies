'use client';

import { Button } from '@movies/ui/components/button';
import { Check, GripVertical } from 'lucide-react';

import { ListHeaderActionPlaceholder } from '@/components/list-header-skeletons';

type ReorderButtonProps = {
  isEditing: boolean;
  onToggleEditing: () => void;
};

/** Toggles a list page's manual-reorder mode. */
function ReorderButton({ isEditing, onToggleEditing }: ReorderButtonProps) {
  return (
    <Button
      variant={isEditing ? 'default' : 'outline'}
      className="size-11 gap-2 p-0 sm:h-10 sm:w-auto sm:px-3"
      onClick={onToggleEditing}
      aria-pressed={isEditing}
      aria-label={isEditing ? 'Done' : 'Reorder items'}
      title={isEditing ? 'Done' : 'Reorder items'}
    >
      {isEditing ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Done</span>
        </>
      ) : (
        <>
          <GripVertical className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Reorder</span>
        </>
      )}
    </Button>
  );
}

/** Keeps the header's flex geometry stable when reordering is unavailable. */
export function ReorderButtonSlot({
  isAvailable,
  ...props
}: ReorderButtonProps & { isAvailable: boolean }) {
  if (!isAvailable) {
    return (
      <ListHeaderActionPlaceholder
        label="Reorder"
        slot="reorder-button-spacer"
        showSkeleton={false}
      />
    );
  }

  return <ReorderButton {...props} />;
}
