import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import { ScrollToTop } from '@/components/scroll-to-top';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the list details page.
 *
 * Displays placeholder UI matching the structure of the list details page:
 * - Header with list title and action buttons
 * - List metadata (item count, creation date, description)
 * - Grid of item cards
 * - Pagination controls
 */
export default function ListDetailsLoading() {
  return (
    <div className="@container w-full">
      <ScrollToTop />
      {/* Header section */}
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        <div className="flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Description placeholder */}
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Items grid */}
      <PosterSkeletonGrid />

      {/* Pagination controls placeholder */}
      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}
