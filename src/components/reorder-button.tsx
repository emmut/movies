'use client';

import { Check, GripVertical } from 'lucide-react';

import { HeaderButtonSpacer } from '@/components/list-header-skeletons';
import { Button } from '@/components/ui/button';

type ReorderButtonProps = {
  isEditing: boolean;
  onToggleEditing: () => void;
};

/** Toggles a list page's manual-reorder mode. */
function ReorderButton({ isEditing, onToggleEditing }: ReorderButtonProps) {
  return (
    <Button
      variant={isEditing ? 'default' : 'secondary'}
      size="sm"
      onClick={onToggleEditing}
      aria-pressed={isEditing}
    >
      {isEditing ? (
        <>
          <Check className="h-4 w-4" />
          Done
        </>
      ) : (
        <>
          <GripVertical className="h-4 w-4" />
          Reorder items
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
    return <HeaderButtonSpacer label="Reorder items" slot="reorder-button-spacer" />;
  }

  return <ReorderButton {...props} />;
}
