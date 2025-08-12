'use client';

import ItemCard from '@/components/item-card';
import MediaTypeSelector from '@/components/media-type-selector';
import SectionTitle from '@/components/section-title';
import { Spinner } from '@/components/spinner';
import { useWatchlistWithDetails } from '@/hooks/use-watchlist-query';
import { MovieDetails } from '@/types/movie';
import { TvDetails } from '@/types/tv-show';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

type WatchlistPageClientProps = {
  userId?: string;
};

/**
 * Client-side watchlist page component with TanStack Query data fetching.
 *
 * Provides real-time data updates, optimistic UI, and proper loading/error states.
 * Automatically redirects unauthenticated users to login.
 */
export function WatchlistPageClient({ userId }: WatchlistPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mediaType = (searchParams.get('mediaType') ?? 'movie') as
    | 'movie'
    | 'tv';

  // Redirect to login if no user
  useEffect(() => {
    if (userId === undefined) {
      // Still loading user session
      return;
    }
    if (!userId) {
      router.push('/login');
    }
  }, [userId, router]);

  // Fetch watchlist data for both media types
  const {
    data: watchlistMovies = [],
    isLoading: isLoadingMovies,
    error: moviesError,
  } = useWatchlistWithDetails('movie');

  const {
    data: watchlistTvShows = [],
    isLoading: isLoadingTv,
    error: tvError,
  } = useWatchlistWithDetails('tv');

  // Show loading spinner if user session is still being determined
  if (userId === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!userId) {
    return null;
  }

  // Filter based on selected media type
  const filteredItems =
    mediaType === 'movie' ? watchlistMovies : watchlistTvShows;
  const totalMovies = watchlistMovies.length;
  const totalTvShows = watchlistTvShows.length;
  const totalItems = totalMovies + totalTvShows;

  // Show loading state while data is being fetched
  const isLoading = isLoadingMovies || isLoadingTv;

  // Show error state if there's an error
  const error = moviesError || tvError;
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl opacity-50">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold">
            Error loading watchlist
          </h2>
          <p className="mb-6 text-zinc-400">
            {error.message || 'Something went wrong. Please try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <SectionTitle>My Watchlist</SectionTitle>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Spinner size={16} />
              <span>Updating...</span>
            </div>
          )}
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

      {/* Loading state for initial load */}
      {isLoading && filteredItems.length === 0 ? (
        <div className="py-12 text-center">
          <div className="flex items-center justify-center gap-2">
            <Spinner />
            <span>Loading your watchlist...</span>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty state */
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
        /* Items grid */
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredItems
            .filter((item) => item !== null && item.resource)
            .map((item) => {
              const resourceType = item.resourceType as 'movie' | 'tv';
              return (
                <ItemCard
                  key={`${resourceType}-${item.resourceId}`}
                  resource={item.resource as MovieDetails | TvDetails}
                  type={resourceType}
                  userId={userId}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}

