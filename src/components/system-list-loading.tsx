import {
  HeaderButtonSkeleton,
  MediaTypeSelectorSkeleton,
} from '@/components/list-header-skeletons';
import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import SectionTitle from '@/components/section-title';
import { Skeleton } from '@/components/ui/skeleton';

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

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <HeaderButtonSkeleton label="Providers" slot="watch-provider-filter-skeleton" />
            <HeaderButtonSkeleton label="Reorder items" slot="reorder-button-skeleton" />
          </div>

          <MediaTypeSelectorSkeleton />
        </div>
      </div>

      <PosterSkeletonGrid />
    </div>
  );
}
