import { Skeleton } from '@/components/ui/skeleton';
import { ITEMS_PER_PAGE } from '@/lib/config';

/**
 * Placeholder grid of poster-shaped skeleton cards, matching the responsive
 * item-grid layout used by collection and list pages.
 */
export function PosterSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4 @8xl:grid-cols-5">
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
        <Skeleton key={i} className="aspect-2/3 w-full rounded-lg" />
      ))}
    </div>
  );
}
