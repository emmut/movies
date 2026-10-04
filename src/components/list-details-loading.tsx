import { HeaderButtonSkeleton } from '@/components/list-header-skeletons';
import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import { Skeleton } from '@/components/ui/skeleton';

/** Shared route and client-query fallback for a custom list detail page. */
export function ListDetailsLoadingSkeleton() {
  return (
    <div className="@container w-full">
      <div className="mb-8 flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />

        <div data-slot="list-description-skeleton" className="flex h-12 flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <HeaderButtonSkeleton label="Providers" slot="watch-provider-filter-skeleton" />
            <HeaderButtonSkeleton label="Reorder items" slot="reorder-button-skeleton" />
          </div>

          <div className="flex items-center gap-2">
            <HeaderButtonSkeleton
              label="Edit List"
              slot="edit-list-button-skeleton"
              iconMarginEnd
            />
            <HeaderButtonSkeleton
              label="Delete List"
              slot="delete-list-button-skeleton"
              iconMarginEnd
            />
          </div>
        </div>
      </div>

      <PosterSkeletonGrid />

      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="size-9" />
          ))}
        </div>
      </div>
    </div>
  );
}
