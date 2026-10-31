import { Skeleton } from '@movies/ui/components/skeleton';
import { cn } from 'cn';
import type { ReactNode } from 'react';

type HeaderButtonSkeletonProps = {
  label: string;
  slot: string;
  size?: 'default' | 'sm';
  iconMarginEnd?: boolean;
};

/** Matches header actions: an icon on mobile, with a label on wider screens. */
export function ListHeaderActionPlaceholder({
  label,
  slot,
  showSkeleton,
}: {
  label: string;
  slot: string;
  showSkeleton: boolean;
}) {
  return (
    <div
      data-slot={slot}
      aria-hidden="true"
      className="relative inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-medium whitespace-nowrap sm:h-10 sm:w-auto sm:px-3"
    >
      <span className="invisible size-4" />
      <span className="invisible hidden sm:inline">{label}</span>
      {showSkeleton && <Skeleton className="absolute inset-0" />}
    </div>
  );
}

/** Reserves the intrinsic width of a loaded icon-and-label button. */
export function HeaderButtonSkeleton({
  label,
  slot,
  size = 'sm',
  iconMarginEnd = false,
}: HeaderButtonSkeletonProps) {
  const sizeClassName =
    size === 'default' ? 'h-8 gap-1.5 px-2.5 text-sm' : 'h-7 gap-1 px-2.5 text-[0.8rem]';

  return (
    <div
      data-slot={slot}
      aria-hidden="true"
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-lg border border-transparent font-medium whitespace-nowrap',
        sizeClassName,
      )}
    >
      <span className={cn('invisible size-4', iconMarginEnd && 'mr-2')} />
      <span className="invisible">{label}</span>
      <Skeleton className="absolute inset-0" />
    </div>
  );
}

/** Placeholder with the exact box model and intrinsic width of MediaTypeSelector. */
export function MediaTypeSelectorSkeleton() {
  return (
    <div
      data-slot="media-type-selector-skeleton"
      aria-hidden="true"
      className="flex h-11 rounded-lg bg-muted/60 p-1"
    >
      <MediaTypeButtonSkeleton label="Movies" />
      <MediaTypeButtonSkeleton label="TV Shows" />
    </div>
  );
}

function MediaTypeButtonSkeleton({ label }: { label: string }) {
  return (
    <div className="relative flex h-9 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium">
      <span className="invisible size-4" />
      <span className="invisible">{label}</span>
      <Skeleton className="absolute inset-0" />
    </div>
  );
}

/** Reserves the exact intrinsic box of a labelless filter toolbar button. */
export function ToolbarButtonSkeleton({ slot, children }: { slot: string; children: ReactNode }) {
  return (
    <div
      data-slot={slot}
      aria-hidden="true"
      className="relative inline-flex h-10 shrink-0 items-center rounded-lg border border-transparent px-4 text-sm font-medium whitespace-nowrap"
    >
      <span className="invisible inline-flex items-center gap-2">{children}</span>
      <Skeleton className="absolute inset-0" />
    </div>
  );
}
