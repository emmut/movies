'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

import ItemCard from '@/components/item-card';
import MediaTypeSelector from '@/components/media-type-selector';
import { PaginationControls } from '@/components/pagination-controls';
import SectionTitle from '@/components/section-title';
import { Skeleton } from '@/components/ui/skeleton';
import { useScrollOnPageChange } from '@/hooks/use-scroll-on-page-change';
import { ITEMS_PER_PAGE } from '@/lib/config';
import { queryKeys } from '@/lib/query-keys';
import { getWatchedCount, getWatchedWithResourceDetailsPaginated } from '@/lib/watched';
import { MovieDetails } from '@/types/movie';
import { TvDetails } from '@/types/tv-show';

type WatchedContentProps = {
  userId?: string;
};

/**
 * Client component that handles the watched page content with React Query.
 * Uses nuqs to manage URL state, which automatically triggers React Query refetches.
 */
export function WatchedContent({ userId }: WatchedContentProps) {
  // Use nuqs to manage URL state
  const [urlState] = useQueryStates(
    {
      mediaType: parseAsString.withDefault('movie'),
      page: parseAsInteger.withDefault(1),
    },
    {
      history: 'push',
    },
  );

  const mediaType = urlState.mediaType as 'movie' | 'tv';
  const page = urlState.page;

  useScrollOnPageChange(page);

  // Fetch paginated watched data
  const { data: paginatedData, isLoading: isLoadingList } = useQuery({
    queryKey: queryKeys.watched.list(mediaType, page),
    queryFn: () => getWatchedWithResourceDetailsPaginated(mediaType, page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch movie count
  const { data: totalMovies = 0 } = useQuery({
    queryKey: queryKeys.watched.count('movie'),
    queryFn: () => getWatchedCount('movie'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch TV count
  const { data: totalTvShows = 0 } = useQuery({
    queryKey: queryKeys.watched.count('tv'),
    queryFn: () => getWatchedCount('tv'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const filteredItems = paginatedData?.items || [];
  const totalPages = paginatedData?.totalPages || 0;
  const totalItems = totalMovies + totalTvShows;
  const mediaLabel = mediaType === 'movie' ? 'movies' : 'TV shows';

  return (
    <div className="@container w-full">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <SectionTitle>Watched</SectionTitle>
        </div>

        <div className="flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-zinc-400">
              {mediaType === 'movie'
                ? `${totalMovies} movie${totalMovies !== 1 ? 's' : ''} watched`
                : `${totalTvShows} TV show${totalTvShows !== 1 ? 's' : ''} watched`}
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
        <div className="@8xl:grid-cols-5 grid grid-cols-2 gap-4 @3xl:grid-cols-4">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <Skeleton key={i} className="aspect-2/3 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl opacity-50">{mediaType === 'movie' ? '🎬' : '📺'}</div>
          <h2 className="mb-2 text-xl font-semibold">
            {totalItems === 0
              ? "You haven't watched anything yet"
              : `No ${mediaLabel} watched yet`}
          </h2>
          <p className="mb-6 text-zinc-400">
            {totalItems === 0
              ? `Mark ${mediaLabel} as watched from any detail page to track them here`
              : `Mark some ${mediaLabel} as watched to see them here`}
          </p>
          <Link
            href={`/discover?mediaType=${mediaType}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Explore {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
          </Link>
        </div>
      ) : (
        <div
          id="content-container"
          className="@8xl:grid-cols-5 grid grid-cols-2 gap-4 @3xl:grid-cols-4"
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
        <PaginationControls totalPages={totalPages} pageType="watched" />
      )}
    </div>
  );
}
