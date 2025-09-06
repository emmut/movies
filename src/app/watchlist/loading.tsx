import { Skeleton } from '@/components/ui/skeleton';

/**
 * Displays a skeleton placeholder UI for the watchlist page while content is loading.
 *
 * Renders a header section and a responsive grid of 12 placeholder cards to simulate the layout of the watchlist.
 */
export default function WatchlistLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-2/3 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
