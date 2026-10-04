import { cn } from 'cn';

import { Skeleton } from '@/components/ui/skeleton';

type HeaderButtonSkeletonProps = {
  label: string;
  slot: string;
  size?: 'default' | 'sm';
  iconMarginEnd?: boolean;
};

type HeaderButtonFrameProps = HeaderButtonSkeletonProps & {
  showSkeleton: boolean;
};

/**
 * Button-shaped placeholder whose invisible contents reserve the same width as
 * the loaded icon-and-label button. This keeps flex wrapping identical while
 * the route streams in.
 */
export function HeaderButtonSkeleton({
  label,
  slot,
  size = 'sm',
  iconMarginEnd = false,
}: HeaderButtonSkeletonProps) {
  return (
    <HeaderButtonFrame
      label={label}
      slot={slot}
      size={size}
      iconMarginEnd={iconMarginEnd}
      showSkeleton
    />
  );
}

/** Invisible loaded-state spacer for a conditionally unavailable button. */
export function HeaderButtonSpacer(props: HeaderButtonSkeletonProps) {
  return <HeaderButtonFrame {...props} showSkeleton={false} />;
}

function HeaderButtonFrame({
  label,
  slot,
  size = 'sm',
  iconMarginEnd = false,
  showSkeleton,
}: HeaderButtonFrameProps) {
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
      {showSkeleton && <Skeleton className="absolute inset-0" />}
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
