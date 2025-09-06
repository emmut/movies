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
    <div className="container mx-auto px-4 py-8">
      {/* Header section */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-2/3 w-full rounded-lg" />
          </div>
        ))}
      </div>

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
