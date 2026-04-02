'use client';

import MediaTypeSelector from '@/components/media-type-selector';
import { PaginationControls } from '@/components/pagination-controls';
import SectionTitle from '@/components/section-title';
import Link from 'next/link';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { ReactNode } from 'react';

type WatchlistContentProps = {
  grid: ReactNode;
  totalMovies: number;
  totalTvShows: number;
  totalPages: number;
  userId?: string;
};

/**
 * Client component that handles the watchlist page content.
 * Uses nuqs to manage URL state for media type and pagination.
 */
export function WatchlistContent({
  grid,
  totalMovies,
  totalTvShows,
  totalPages,
}: WatchlistContentProps) {
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

      {totalItems === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl opacity-50">{mediaType === 'movie' ? '🎬' : '📺'}</div>
          <h2 className="mb-2 text-xl font-semibold">Your watchlist is empty</h2>
          <p className="mb-6 text-zinc-400">
            Start adding {mediaType === 'movie' ? 'movies' : 'TV shows'} by clicking the star on
            any detail page
          </p>
          <Link
            href={`/discover?mediaType=${mediaType}`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
          >
            Explore {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
          </Link>
        </div>
      ) : (
        grid
      )}

      {totalPages > 1 && <PaginationControls totalPages={totalPages} pageType="watchlist" />}
    </div>
  );
}
