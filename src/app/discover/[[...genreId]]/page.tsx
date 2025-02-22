import { Suspense } from 'react';
import SectionTitle from '@/components/SectionTitle';
import Spinner from '@/components/Spinner';
import SkipToElement from '@/components/SkipToElement';
import AvailableGenresNavigation from '@/components/AvailableGenresNavigation';
import Movies from '@/components/Movies';
import Pagination from './pagination';

type DiscoverWithGenreParams = {
  params: Promise<{
    genreId?: string[];
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function DiscoverWithGenrePage(
  props: DiscoverWithGenreParams
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  let genreId: number;

  if (params.genreId && params.genreId.length > 0) {
    genreId = Number(params.genreId[0]);
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
