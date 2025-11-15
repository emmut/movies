'use client';

import { PaginationControls } from '@/components/pagination-controls';
import Spinner from '@/components/spinner';
import { useDiscoverMedia } from '@/hooks/use-discover-query';

type PaginationProps = {
  currentPage: number;
  currentGenreId: number;
  mediaType: 'movie' | 'tv';
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
  runtimeGte?: number;
};

/**
 * Renders pagination controls for discovering movies or TV shows based on the current filters.
 *
 * Fetches the total number of pages for the selected media type and filters, then displays pagination controls for navigation.
 *
 * @param currentPage - The currently selected page number.
 * @param currentGenreId - The genre identifier to filter results.
 * @param mediaType - The type of media to paginate, either 'movie' or 'tv'.
 * @param sortBy - The sort order for the results.
 * @param watchProviders - Comma-separated list of watch provider IDs.
 * @param watchRegion - The region code for watch providers.
 * @returns A React element displaying pagination controls for the selected media type.
 */
export default function Pagination({
  currentPage,
  currentGenreId,
  mediaType,
  sortBy,
  watchProviders,
  watchRegion,
  runtimeGte,
}: PaginationProps) {
  const { data, isLoading } = useDiscoverMedia({
    mediaType,
    genreId: currentGenreId,
    page: currentPage,
    sortBy,
    watchProviders,
    watchRegion,
    runtimeGte,
  });

  if (isLoading) {
    return <Spinner className="mx-auto mt-8" />;
  }

  if (!data) {
    return null;
  }

  return (
    <PaginationControls totalPages={data.totalPages} pageType="discover" />
  );
}
