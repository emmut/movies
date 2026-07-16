'use client';

import { Check, GripVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ReorderButtonProps = {
  isEditing: boolean;
  onToggleEditing: () => void;
};

/** Toggles a list page's manual-reorder mode. */
export function ReorderButton({ isEditing, onToggleEditing }: ReorderButtonProps) {
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
