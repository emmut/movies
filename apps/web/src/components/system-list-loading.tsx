import { Skeleton } from '@movies/ui/components/skeleton';
import { Filter } from 'lucide-react';

import {
  HeaderButtonSkeleton,
  MediaTypeSelectorSkeleton,
  ToolbarButtonSkeleton,
} from '@/components/list-header-skeletons';
import { ListToolbarRow } from '@/components/list-toolbar-row';
import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import SectionTitle from '@/components/section-title';

type SystemListLoadingProps = {
  title: string;
};

/**
 * Skeleton placeholder for a system list page (watchlist, watched) while
 * content is loading. Mirrors the real header — title, item count, and the
 * provider/reorder controls, and media-type selector — above a responsive grid
 * of placeholder poster cards, so the layout stays put when the fetched list
 * renders in. The static title is rendered for real to avoid a flash.
 */
export function SystemListLoading({ title }: SystemListLoadingProps) {
  return (
    <div className="@container w-full">
      <div className="mb-8 flex flex-col gap-4">
        <div>
          <div className="mb-2 flex items-center gap-4">
            <SectionTitle>{title}</SectionTitle>
          </div>
          <div className="flex h-6 items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <ListToolbarRow
          filters={
            <>
              <MediaTypeSelectorSkeleton />
              <ToolbarButtonSkeleton slot="watch-provider-filter-skeleton">
                <Filter className="size-4" />
                Providers
              </ToolbarButtonSkeleton>
            </>
          }
          actions={<HeaderButtonSkeleton label="Reorder items" slot="reorder-button-skeleton" />}
        />
      </div>

      <PosterSkeletonGrid />
    </div>
  );
}
