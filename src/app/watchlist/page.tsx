import MediaTypeSelector from '@/components/media-type-selector';
import SectionTitle from '@/components/section-title';
import WatchlistItemsGrid from '@/components/watchlist-items-grid';
import { watchlistKeys } from '@/hooks/use-watchlist-query';
import { getUser, getUserWatchlist } from '@/lib/auth-server';
import getQueryClient from '@/lib/get-query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type WatchlistPageProps = {
  searchParams: Promise<{
    mediaType?: string;
  }>;
};

/**
 * Hybrid watchlist page using RSC for preloading basic data and TanStack Query for movie details.
 *
 * Uses React Server Components to:
 * - Check authentication and redirect if needed
 * - Preload basic watchlist data (IDs and counts)
 * - Prefetch data into TanStack Query cache
 *
 * Uses TanStack Query on client for:
 * - Fetching detailed movie/TV data
 * - Real-time updates and mutations
 * - Optimistic UI updates
 */
export default async function WatchlistPage(props: WatchlistPageProps) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const mediaType = (searchParams.mediaType ?? 'movie') as 'movie' | 'tv';

  // Fetch basic watchlist data on server (just IDs, no detailed movie data)
  const watchlistItems = await getUserWatchlist();

  // Separate by media type for counts
  const movieItems = watchlistItems.filter(
    (item) => item.resourceType === 'movie'
  );
  const tvItems = watchlistItems.filter((item) => item.resourceType === 'tv');
  const totalMovies = movieItems.length;
  const totalTvShows = tvItems.length;
  const totalItems = totalMovies + totalTvShows;

  // Prefetch watchlist data into TanStack Query cache
  const queryClient = getQueryClient();

  // Prefetch the basic watchlist data
  await queryClient.prefetchQuery({
    queryKey: watchlistKeys.user(),
    queryFn: async () => watchlistItems,
  });

  // Filter items for current media type
  const filteredItems = mediaType === 'movie' ? movieItems : tvItems;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <SectionTitle>My Watchlist</SectionTitle>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <p className="text-zinc-400">
                {mediaType === 'movie'
                  ? `${totalMovies} movie${totalMovies !== 1 ? 's' : ''} saved`
                  : `${totalTvShows} TV show${totalTvShows !== 1 ? 's' : ''} saved`}
              </p>
              {totalItems > 0 && (
                <span className="text-zinc-500">
                  • Total: {totalItems} item{totalItems !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <MediaTypeSelector currentMediaType={mediaType} />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl opacity-50">
              {mediaType === 'movie' ? '🎬' : '📺'}
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              {totalItems === 0
                ? 'Your watchlist is empty'
                : `No ${mediaType === 'movie' ? 'movies' : 'TV shows'} in your watchlist`}
            </h2>
            <p className="mb-6 text-zinc-400">
              {totalItems === 0
                ? `Start adding ${mediaType === 'movie' ? 'movies' : 'TV shows'} by clicking the star on any detail page`
                : `Add some ${mediaType === 'movie' ? 'movies' : 'TV shows'} to see them here`}
            </p>
            <Link
              href={`/discover?mediaType=${mediaType}`}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
            >
              Explore {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
            </Link>
          </div>
        ) : (
          <WatchlistItemsGrid
            watchlistItems={filteredItems}
            mediaType={mediaType}
            userId={user.id}
          />
        )}
      </div>
    </HydrationBoundary>
  );
}
