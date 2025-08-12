'use client';

import ItemCard from '@/components/item-card';
import { MovieDetails } from '@/types/movie';
import { TvDetails } from '@/types/tv-show';
import { useQuery } from '@tanstack/react-query';

type WatchlistItem = {
  id: string;
  userId: string;
  resourceId: number;
  resourceType: string;
  createdAt: Date;
};

type WatchlistItemsGridProps = {
  watchlistItems: WatchlistItem[];
  mediaType: 'movie' | 'tv';
  userId: string;
};

/**
 * Client component that uses TanStack Query to fetch detailed movie/TV data
 * for each item in the watchlist and renders them in a grid.
 *
 * This component receives basic watchlist data from RSC and then fetches
 * detailed information client-side for better performance and real-time updates.
 */
export default function WatchlistItemsGrid({
  watchlistItems,
  mediaType,
  userId,
}: WatchlistItemsGridProps) {
  // Create queries for each watchlist item to fetch detailed data
  const itemQueries = useQuery({
    queryKey: [
      'watchlist-details',
      mediaType,
      watchlistItems.map((item) => item.resourceId),
    ],
    queryFn: async (): Promise<(MovieDetails | TvDetails)[]> => {
      if (watchlistItems.length === 0) return [];

      // Fetch all items in parallel
      const promises = watchlistItems.map(async (item) => {
        const endpoint =
          mediaType === 'movie'
            ? `/api/movies/${item.resourceId}`
            : `/api/tv/${item.resourceId}`;

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${mediaType} ${item.resourceId}`);
        }
        return response.json();
      });

      const results = await Promise.allSettled(promises);

      // Filter out failed requests and return successful ones
      return results
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<MovieDetails | TvDetails> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: watchlistItems.length > 0,
  });

  const { data: detailedItems, isLoading, error } = itemQueries;

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {watchlistItems.map((item) => (
          <div key={item.id} className="animate-pulse">
            <div className="aspect-[2/3] rounded-lg bg-zinc-800"></div>
            <div className="mt-2 h-4 rounded bg-zinc-800"></div>
            <div className="mt-1 h-3 w-3/4 rounded bg-zinc-800"></div>
          </div>
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-6xl opacity-50">⚠️</div>
        <h2 className="mb-2 text-xl font-semibold">
          Error loading {mediaType}s
        </h2>
        <p className="mb-6 text-zinc-400">
          {error.message ||
            'Something went wrong while loading your watchlist items.'}
        </p>
        <button
          onClick={() => itemQueries.refetch()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show items
  if (!detailedItems || detailedItems.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-6xl opacity-50">📭</div>
        <h2 className="mb-2 text-xl font-semibold">No items found</h2>
        <p className="text-zinc-400">
          We couldn't load the details for your {mediaType}s. They might have
          been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {detailedItems.map((item, index) => {
        const watchlistItem = watchlistItems[index];
        if (!watchlistItem) return null;

        return (
          <ItemCard
            key={`${mediaType}-${item.id}`}
            resource={item}
            type={mediaType}
            userId={userId}
          />
        );
      })}
    </div>
  );
}
