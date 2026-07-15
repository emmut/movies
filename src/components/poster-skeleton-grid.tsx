import { Skeleton } from '@/components/ui/skeleton';
import { ITEMS_PER_PAGE } from '@/lib/config';

/**
 * Placeholder grid of poster-shaped skeleton cards, matching the responsive
 * item-grid layout used by the system list and list detail pages.
 *
 * Height-capped and clipped so the loading skeleton stays close to one
 * viewport. A tall skeleton keeps the previous route's scroll offset on a
 * client navigation (Next only resets scroll once real content arrives), which
 * shows it "chopped off"; a short one lets the browser clamp scroll to the top.
 */
export function PosterSkeletonGrid() {
  return (
    <div className="grid max-h-[45vh] grid-cols-2 gap-4 overflow-hidden @3xl:grid-cols-4 @8xl:grid-cols-5">
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
        <Skeleton key={i} className="aspect-2/3 w-full rounded-lg" />
      ))}
    </div>
  );
}
