import AvailableGenresNavigation from '@/components/available-genre-navigation';
import Movies from '@/components/movies';
import SectionTitle from '@/components/section-title';
import SkipToElement from '@/components/skip-to-element';
import Spinner from '@/components/spinner';
import { Suspense } from 'react';
import Pagination from './pagination';

type DiscoverWithGenreParams = {
  searchParams: Promise<{
    page?: string;
    genreId?: string;
  }>;
};

export default async function DiscoverWithGenrePage(
  props: DiscoverWithGenreParams
) {
  const searchParams = await props.searchParams;
  let genreId: number;

  if (searchParams.genreId) {
    genreId = Number(searchParams.genreId);
  } else {
    genreId = 0;
  }

  const page = Number(searchParams.page ?? '1');

  return (
    <>
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>

        <SkipToElement elementId="movies-container">
          Skip to movies
        </SkipToElement>
      </div>

      <div className="relative mt-2 flex flex-wrap gap-2">
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
        className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <Suspense fallback={<Movies.Ghosts />}>
          <Movies currentGenreId={genreId} currentPage={page} />
        </Suspense>
      </div>

      <Suspense fallback={<Spinner className="mx-auto mt-8" />}>
        <Pagination currentGenreId={genreId} currentPage={page} />
      </Suspense>
    </>
  );
}
