import { Skeleton } from '@movies/ui/components/skeleton';

import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import SectionTitle from '@/components/section-title';

/** Reserve space for the compact Discover toolbar. */
export default function DiscoverLoading() {
  return (
    <div className="@container w-full">
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>
      </div>
      <div className="mt-6 flex items-center gap-4" aria-hidden="true">
        <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <div className="hidden gap-3 @[60rem]:flex">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-24" />
          ))}
        </div>
        <Skeleton className="ml-auto h-10 w-24 @[60rem]:hidden" />
        <Skeleton className="ml-auto hidden h-10 w-54 @[60rem]:block" />
      </div>
      <div className="mt-7">
        <PosterSkeletonGrid />
      </div>
    </div>
  );
}
