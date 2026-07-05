import { Skeleton } from '@/components/ui/skeleton';
import { ITEMS_PER_PAGE } from '@/lib/config';

/**
 * Displays a skeleton placeholder UI for the watchlist page while content is loading.
 *
 * Renders a header section and a responsive grid of placeholder cards to simulate the layout of the watchlist.
 */
export default function WatchlistLoading() {
  return (
    <div className="container @container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 gap-4 @5xl:grid-cols-4 @8xl:grid-cols-5">
        {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-2/3 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
