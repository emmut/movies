'use client';

import { useDiscoverMedia } from '@/hooks/use-discover-query';
import ItemGrid from './item-grid';

type DiscoverGridProps = {
  currentGenreId: number;
  currentPage: number;
  mediaType: 'movie' | 'tv';
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
  runtimeGte?: number;
  userId?: string;
};

/**
 * Displays a grid of movies or TV shows based on the selected filters.
 *
 * Fetches data based on the media type and applied filters, then renders a ResourceGrid with the results.
 *
 * @param currentGenreId - The ID of the genre to filter by.
 * @param currentPage - The page number of results to display.
 * @param mediaType - Whether to show movies or TV shows.
 * @param sortBy - The sort order for the results.
 * @param watchProviders - Comma-separated list of watch provider IDs.
 * @param watchRegion - The region code for watch providers.
 * @param userId - Optional user ID to enable list functionality.
 */
export default function DiscoverGrid({
  currentGenreId,
  currentPage,
  mediaType,
  sortBy,
  watchProviders,
  watchRegion,
  runtimeGte,
  userId,
}: DiscoverGridProps) {
  const { data, isLoading, error } = useDiscoverMedia({
    mediaType,
    genreId: currentGenreId,
    page: currentPage,
    sortBy,
    watchProviders,
    watchRegion,
    runtimeGte,
  });

  if (isLoading) {
    return <ItemGrid.Skeletons className="w-full" />;
  }

  if (error) {
    return (
      <div className="col-span-full text-center text-red-500">
        Error loading content. Please try again.
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="text-muted-foreground col-span-full text-center">
        No results found.
      </div>
    );
  }

  return <ItemGrid resources={data.results} type={mediaType} userId={userId} />;
}
