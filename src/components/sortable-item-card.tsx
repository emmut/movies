'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

import { ReorderControls } from '@/components/reorder-controls';
import { cn } from '@/lib/utils';

interface SortableItemCardProps {
  id: string;
  name: string;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  editing: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: ReactNode;
}

/**
 * Wraps a content card (movie, TV show, or person) with dnd-kit sortable
 * behavior. Reorder controls (move up/down + drag handle) appear only while
 * the parent list is in editing mode.
 */
export function SortableItemCard({
  id,
  name,
  isFirst,
  isLast,
  disabled,
  editing,
  onMoveUp,
  onMoveDown,
  children,
}: SortableItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative',
        isDragging && 'z-10 opacity-80',
        editing && 'rounded-lg ring-2 ring-blue-400/50 ring-offset-2 ring-offset-black',
      )}
    >
      {editing && (
        <ReorderControls
          name={name}
          isFirst={isFirst}
          isLast={isLast}
          disabled={disabled}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          handleAttributes={attributes}
          handleListeners={listeners}
          className="absolute top-2 right-2 z-20 flex gap-1"
        />
      )}
      {children}
    </div>
  );
}
