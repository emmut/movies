import { Skeleton } from '@movies/ui/components/skeleton';

import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import SectionTitle from '@/components/section-title';

/** Reserve space for the desktop filter bar and compact mobile toolbar. */
export default function DiscoverLoading() {
  return (
    <div className="@container w-full">
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>
      </div>
      <div className="mt-6 hidden space-y-5 @[60rem]:block" aria-hidden="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 @[60rem]:mt-5 @[60rem]:border-t @[60rem]:border-border @[60rem]:pt-4">
        <Skeleton className="h-10 w-24 @[60rem]:hidden" />
        <div className="hidden items-end gap-3 @[60rem]:flex" aria-hidden="true">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-54" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="ml-auto flex gap-1 rounded-lg bg-muted/60 p-1">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
      <div className="mt-7">
        <PosterSkeletonGrid />
      </div>
    </div>
  );
}
