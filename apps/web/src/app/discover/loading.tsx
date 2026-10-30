import { Skeleton } from '@movies/ui/components/skeleton';

import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import SectionTitle from '@/components/section-title';

/** Matches the compact toolbar on desktop and mobile to keep results in place. */
export default function DiscoverLoading() {
  return (
    <div className="@container w-full">
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>
      </div>
      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4">
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
