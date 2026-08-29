'use client';

import { useDiscoverMedia } from '@/hooks/use-discover-query';

import ItemGrid from './item-grid';

type DiscoverGridProps = {
  currentGenreIds: number[];
  currentPage: number;
  mediaType: 'movie' | 'tv';
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
  runtimeLte?: number;
  originCountry?: string;
  userId?: string;
};

/**
 * Displays a grid of movies or TV shows based on the selected filters.
 *
 * Fetches data based on the media type and applied filters, then renders a ResourceGrid with the results.
 *
 * @param currentGenreIds - Genre IDs to filter by (any may match).
 * @param currentPage - The page number of results to display.
 * @param mediaType - Whether to show movies or TV shows.
 * @param sortBy - The sort order for the results.
 * @param watchProviders - Comma-separated list of watch provider IDs.
 * @param watchRegion - The region code for watch providers.
 * @param runtimeLte - Maximum runtime filter.
 * @param originCountry - Pipe-separated list of origin country codes.
 * @param userId - Optional user ID to enable list functionality.
 */
export default function DiscoverGrid({
  currentGenreIds,
  currentPage,
  mediaType,
  sortBy,
  watchProviders,
  watchRegion,
  runtimeLte,
  originCountry,
  userId,
}: DiscoverGridProps) {
  const { data, isLoading, error } = useDiscoverMedia({
    mediaType,
    genreIds: currentGenreIds,
    page: currentPage,
    sortBy,
    watchProviders,
    watchRegion,
    runtimeLte,
    originCountry,
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
    return <div className="col-span-full text-center text-muted-foreground">No results found.</div>;
  }

  return <ItemGrid resources={data.results} type={mediaType} userId={userId} />;
}
