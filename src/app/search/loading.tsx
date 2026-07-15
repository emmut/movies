import ItemGrid from '@/components/item-grid';
import SectionTitle from '@/components/section-title';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the search page.
 *
 * Mirrors the search shell — the static title, the media-type dropdown, and the
 * results grid — so the layout matches the real page while results are fetched.
 */
export default function Loading() {
  return (
    <div className="@container w-full">
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle>Search</SectionTitle>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 @3xl:grid-cols-4 @8xl:grid-cols-5">
        <ItemGrid.Skeletons className="w-full" />
      </div>
    </div>
  );
}
