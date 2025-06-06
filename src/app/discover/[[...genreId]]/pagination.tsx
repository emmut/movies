import { PaginationControls } from '@/components/pagination-controlls';
import { fetchDiscoverMovies } from '@/lib/movies';

type PaginationProps = {
  currentPage: number;
  currentGenreId: number;
};

export default async function Pagination({
  currentPage,
  currentGenreId,
}: PaginationProps) {
  const { totalPages } = await fetchDiscoverMovies(currentGenreId, currentPage);
  return <PaginationControls totalPages={totalPages} pageType="discover" />;
}
