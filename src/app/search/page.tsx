import { Suspense } from 'react';
import SectionTitle from '@/components/section-title';
import Movies from '@/components/movies';
import { PaginationControls } from '@/components/pagination-controlls';
import SearchMovies from './search-movies';
import { fetchMoviesBySearchQuery } from '@/lib/search';

type SearchProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
};

export default async function SearchPage(props: SearchProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q ?? '';
  const page = searchParams.page ?? '1';

  const { totalPages } = await fetchMoviesBySearchQuery(query, page);

  return (
    <>
      <SectionTitle>Search</SectionTitle>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Suspense fallback={<Movies.Ghosts />}>
          <SearchMovies currentQuery={query} currentPage={page} />
        </Suspense>
      </div>

      <PaginationControls totalPages={totalPages} />
    </>
  );
}
