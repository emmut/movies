import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import { ScrollToTop } from '@/components/scroll-to-top';
import SectionTitle from '@/components/section-title';
import { Skeleton } from '@/components/ui/skeleton';

type SystemListLoadingProps = {
  title: string;
};

/**
 * Skeleton placeholder for a system list page (watchlist, watched) while
 * content is loading. Mirrors the real header — title, item count, and the
 * media-type selector — above a responsive grid of placeholder poster cards, so
 * the layout stays put when the fetched list renders in. The static title is
 * rendered for real to avoid a flash.
 */
export function SystemListLoading({ title }: SystemListLoadingProps) {
  return (
    <div className="@container w-full">
      <ScrollToTop />
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <SectionTitle>{title}</SectionTitle>
        </div>

        <div className="flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
          <Skeleton className="h-5 w-40" />
          {/* Media-type selector — a two-segment toggle */}
          <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </div>

      <PosterSkeletonGrid />
    </div>
  );
}
