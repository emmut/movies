import { PaginationControls } from '@/components/pagination-controlls';
import { fetchDiscoverMovies } from '@/lib/movies';
import { fetchDiscoverTvShows } from '@/lib/tv-shows';

type PaginationProps = {
  currentPage: number;
  currentGenreId: number;
  mediaType: 'movie' | 'tv';
};

/**
 * Renders pagination controls for discovering movies or TV shows based on the current page, genre, and media type.
 *
 * Fetches the total number of pages for the selected media type and genre, then displays pagination controls for navigation.
 *
 * @param currentPage - The currently selected page number.
 * @param currentGenreId - The genre identifier to filter results.
 * @param mediaType - The type of media to paginate, either 'movie' or 'tv'.
 * @returns A React element displaying pagination controls for the selected media type.
 */
export default async function Pagination({
  currentPage,
  currentGenreId,
  mediaType,
}: PaginationProps) {
  let totalPages: number;

  if (mediaType === 'movie') {
    const { totalPages: movieTotalPages } = await fetchDiscoverMovies(
      currentGenreId,
      currentPage
    );
    totalPages = movieTotalPages;
  } else {
    const { totalPages: tvTotalPages } = await fetchDiscoverTvShows(
      currentGenreId,
      currentPage
    );
    totalPages = tvTotalPages;
  }

  return <PaginationControls totalPages={totalPages} pageType="discover" />;
}
