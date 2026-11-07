import { Skeleton } from '@movies/ui/components/skeleton';
import { ChevronDown, ListFilterIcon, Tag } from 'lucide-react';

import {
  MediaTypeSelectorSkeleton,
  ToolbarButtonSkeleton,
} from '@/components/list-header-skeletons';
import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import SectionTitle from '@/components/section-title';

/** Reserve space for the compact Discover toolbar. */
export default function DiscoverLoading() {
  return (
    <div className="@container w-full">
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>
      </div>
      <div
        className="mt-6 flex flex-wrap items-center gap-4 @[60rem]:flex-nowrap"
        aria-hidden="true"
      >
        <div className="shrink-0">
          <MediaTypeSelectorSkeleton />
        </div>
        <div className="hidden items-center gap-3 @[60rem]:flex">
          <ToolbarButtonSkeleton slot="genre-filter-skeleton">
            Genres
            <ChevronDown className="size-3.5" />
          </ToolbarButtonSkeleton>
          <ToolbarButtonSkeleton slot="keyword-filter-skeleton">
            <Tag className="size-4" />
            Tags
            <ChevronDown className="size-3.5" />
          </ToolbarButtonSkeleton>
          <ToolbarButtonSkeleton slot="additional-filter-skeleton">
            <ListFilterIcon className="size-4" />
            Filters
          </ToolbarButtonSkeleton>
        </div>
        <div className="ml-auto @[60rem]:hidden">
          <ToolbarButtonSkeleton slot="compact-filter-skeleton">
            <ListFilterIcon className="size-4" />
            Filters
          </ToolbarButtonSkeleton>
        </div>
        <Skeleton className="ml-auto hidden h-10 w-54 @[60rem]:block" />
      </div>
      <div className="mt-7">
        <PosterSkeletonGrid />
      </div>
    </div>
  );
}
