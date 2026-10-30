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
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 @[60rem]:mt-5">
        <Skeleton className="h-10 w-24" />
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
