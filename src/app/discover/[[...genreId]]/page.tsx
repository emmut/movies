import { env } from 'process';
import { Suspense } from 'react';
import SectionTitle from '@/components/SectionTitle';
import Spinner from '@/components/Spinner';
import { fetchAvailableGenres, fetchDiscoverMovies } from '@/lib/discover';
import type { MovieResponse } from '@/types/Movie';
import SkipToElement from '@/components/SkipToElement';
import AvailableGenresNavigation from '@/components/AvailableGenresNavigation';
import Movies from '@/components/Movies';
import { PaginationControls } from '@/components/PaginationControls';

type DiscoverWithGenreParams = {
  params: {
    genreId?: string[];
  };
  searchParams: {
    page?: string;
  };
};

export default async function DiscoverWithGenrePage({
  params,
  searchParams,
}: DiscoverWithGenreParams) {
  let genreId: number;

  if (params.genreId && params.genreId.length > 0) {
    genreId = Number(params.genreId[0]);
  } else {
    genreId = 0;
  }

  const page = Number(searchParams.page ?? '1');
  const movies = await fetchDiscoverMovies(genreId, page);

  return (
    <>
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>

        <SkipToElement elementId="movies-container">
          Skip to movies
        </SkipToElement>
      </div>

      <div className="relative mt-2 flex flex-wrap gap-2 pt-3">
        <Suspense
          fallback={
            <Spinner className="flex h-12 items-center justify-center" />
          }
        >
          <AvailableGenresNavigation currentGenreId={genreId} />
        </Suspense>
      </div>

      <div
        id="movies-container"
        tabIndex={0}
        className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <Suspense fallback={<Movies.Ghosts />}>
          <Movies currentGenreId={genreId} currentPage={page} />
        </Suspense>
      </div>

      <PaginationControls totalPages={movies.total_pages} />
    </>
  );
}
