import { env } from 'process';
import { Suspense } from 'react';
import SectionTitle from '@/components/SectionTitle';
import Movies from '@/components/Movies';
import type { SearchedMovieResponse } from '@/types/Movie';
import { PaginationControls } from '@/components/PaginationControls';

type SearchProps = {
  searchParams: {
    q?: string;
    page?: string;
  };
};

async function fetchMoviesBySearchQuery(query: string, page: string) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${query}&page=${page}&sort_by=popularity.desc&include_adult=false&include_video=false`,
    {
      headers: {
        authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
        cache: 'no-store',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed fetching searched movies');
  }

  const movies: SearchedMovieResponse = await res.json();
  return movies;
}

export default async function SearchPage({ searchParams }: SearchProps) {
  const query = searchParams.q ?? '';
  const page = searchParams.page ?? '1';
  const movies = await fetchMoviesBySearchQuery(query, page);

  return (
    <>
      <SectionTitle>Search</SectionTitle>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Suspense fallback={<Movies.Ghosts />}>
          <Movies movies={movies.results} />
        </Suspense>
      </div>

      <PaginationControls totalPages={movies.total_pages} />
    </>
  );
}
