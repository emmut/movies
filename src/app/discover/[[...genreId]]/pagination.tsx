import { PaginationControls } from '@/components/pagination-controlls';
import { fetchDiscoverMovies } from '@/lib/movies';
import { fetchDiscoverTvShows } from '@/lib/tv-shows';

type PaginationProps = {
  currentPage: number;
  currentGenreId: number;
  mediaType: 'movie' | 'tv';
};

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
