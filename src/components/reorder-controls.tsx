'use client';

import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import type { DraggableAttributes } from '@dnd-kit/core';

import { Button } from '@/components/ui/button';

interface ReorderControlsProps {
  name: string;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  handleAttributes: DraggableAttributes;
  handleListeners?: Record<string, Function>;
  className?: string;
}

/**
 * The move up/down buttons and drag handle used to reorder a sortable card.
 * Shared by list cards and list-item cards so the reorder affordances stay
 * identical across both surfaces.
 */
export function ReorderControls({
  name,
  isFirst,
  isLast,
  disabled,
  onMoveUp,
  onMoveDown,
  handleAttributes,
  handleListeners,
  className = 'absolute top-2 left-2 flex gap-1',
}: ReorderControlsProps) {
  return (
    <div className={className}>
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8"
        aria-label={`Move ${name} up`}
        disabled={disabled || isFirst}
        onClick={onMoveUp}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8"
        aria-label={`Move ${name} down`}
        disabled={disabled || isLast}
        onClick={onMoveDown}
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8 cursor-grab touch-none active:cursor-grabbing"
        aria-label={`Reorder ${name}`}
        {...handleAttributes}
        {...handleListeners}
      >
        <GripVertical className="h-4 w-4" />
      </Button>
    </div>
  );
}
