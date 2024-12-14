import { PaginationControls } from '@/components/PaginationControls';
import { fetchDiscoverMovies } from '@/lib/discover';

type PaginationProps = {
  currentPage: number;
  currentGenreId: number;
};

export default async function Pagination({
  currentPage,
  currentGenreId,
}: PaginationProps) {
  const { totalPages } = await fetchDiscoverMovies(currentGenreId, currentPage);
  return <PaginationControls totalPages={totalPages} />;
}
