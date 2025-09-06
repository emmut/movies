import { Skeleton } from '@/components/ui/skeleton';
import { ITEMS_PER_PAGE } from '@/lib/config';

/**
 * Loading skeleton for the lists page.
 *
 * Displays placeholder UI matching the structure of the lists page:
 * - Header with title and create list button
 * - List count metadata
 * - Grid of list cards
 * - Pagination controls
 */
export default function ListsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header section */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Lists grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
          <div
            key={i}
            className="bg-muted/60 border-muted relative block min-h-[200px] overflow-hidden rounded-lg border p-6"
          >
            <div className="flex h-full flex-col">
              <div className="flex-1">
                <Skeleton className="mb-4 h-12 w-12 rounded" />
                <Skeleton className="mb-2 h-6 w-3/4" />
                <div className="min-h-[40px] space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <div className="border-muted mt-4 border-t pt-4">
                <Skeleton className="mb-1 h-4 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
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
