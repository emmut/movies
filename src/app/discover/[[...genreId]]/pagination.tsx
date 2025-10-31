import { PaginationControls } from '@/components/pagination-controls';
import { fetchDiscoverMovies } from '@/lib/movies';
import { fetchDiscoverTvShows } from '@/lib/tv-shows';

type PaginationProps = {
  currentPage: number;
  currentGenreId: number;
  mediaType: 'movie' | 'tv';
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
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
export default async function Pagination({
  currentPage,
  currentGenreId,
  mediaType,
  sortBy,
  watchProviders,
  watchRegion,
}: PaginationProps) {
  let totalPages: number;

  if (mediaType === 'movie') {
    const { totalPages: movieTotalPages } = await fetchDiscoverMovies(
      currentGenreId,
      currentPage,
      sortBy,
      watchProviders,
      watchRegion
    );
    totalPages = movieTotalPages;
  } else {
    const { totalPages: tvTotalPages } = await fetchDiscoverTvShows(
      currentGenreId,
      currentPage,
      sortBy,
      watchProviders,
      watchRegion
    );
    totalPages = tvTotalPages;
  }

  return <PaginationControls totalPages={totalPages} pageType="discover" />;
}
