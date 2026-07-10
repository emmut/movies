import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton placeholder UI for a system list page (watchlist, watched) while
 * content is loading: a header section and a responsive grid of placeholder
 * cards simulating the page layout.
 */
export function SystemListLoading() {
  return (
    <div className="@container w-full">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <PosterSkeletonGrid />
    </div>
  );
}
