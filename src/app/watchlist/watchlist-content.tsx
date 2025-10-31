'use client';

import ItemCard from '@/components/item-card';
import MediaTypeSelector from '@/components/media-type-selector';
import { PaginationControls } from '@/components/pagination-controls';
import SectionTitle from '@/components/section-title';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys } from '@/lib/query-keys';
import {
  getWatchlistCount,
  getWatchlistWithResourceDetailsPaginated,
} from '@/lib/watchlist';
import { MovieDetails } from '@/types/movie';
import { TvDetails } from '@/types/tv-show';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

type WatchlistContentProps = {
  userId?: string;
};

/**
 * Client component that handles the watchlist page content with React Query.
 * Uses nuqs to manage URL state, which automatically triggers React Query refetches.
 */
export function WatchlistContent({ userId }: WatchlistContentProps) {
  // Use nuqs to manage URL state
  const [urlState] = useQueryStates(
    {
      mediaType: parseAsString.withDefault('movie'),
      page: parseAsInteger.withDefault(1),
    },
    {
      history: 'push',
    }
  );

  const mediaType = urlState.mediaType as 'movie' | 'tv';
  const page = urlState.page;

  // Fetch paginated watchlist data
  const { data: paginatedData, isLoading: isLoadingList } = useQuery({
    queryKey: queryKeys.watchlist.list(mediaType, page),
    queryFn: () => getWatchlistWithResourceDetailsPaginated(mediaType, page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch movie count
  const { data: totalMovies = 0 } = useQuery({
    queryKey: queryKeys.watchlist.count('movie'),
    queryFn: () => getWatchlistCount('movie'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch TV count
  const { data: totalTvShows = 0 } = useQuery({
    queryKey: queryKeys.watchlist.count('tv'),
    queryFn: () => getWatchlistCount('tv'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const filteredItems = paginatedData?.items || [];
  const totalPages = paginatedData?.totalPages || 0;
  const totalItems = totalMovies + totalTvShows;

  return (
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

      {isLoadingList ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-2/3 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
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
        <div
          id="content-container"
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        >
          {filteredItems
            .filter((item) => item !== null)
            .map((item) => {
              const resourceType = item.resourceType as 'movie' | 'tv';
              return (
                <ItemCard
                  key={`${resourceType}-${item.id}`}
                  resource={item.resource as MovieDetails | TvDetails}
                  type={resourceType}
                  userId={userId}
                />
              );
            })}
        </div>
      )}

      {filteredItems.length > 0 && totalPages > 1 && (
        <PaginationControls totalPages={totalPages} pageType="watchlist" />
      )}
    </div>
  );
}
