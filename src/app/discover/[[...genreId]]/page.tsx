import AvailableGenresNavigation from '@/components/available-genre-navigation';
import MediaTypeSelector from '@/components/media-type-selector';
import Movies from '@/components/movies';
import SectionTitle from '@/components/section-title';
import SkipToElement from '@/components/skip-to-element';
import Spinner from '@/components/spinner';
import TvShows from '@/components/tv-shows';
import { Suspense } from 'react';
import Pagination from './pagination';

type DiscoverWithGenreParams = {
  searchParams: Promise<{
    page?: string;
    genreId?: string;
    mediaType?: string;
  }>;
};

/**
 * Renders a media discovery page filtered by genre, page number, and media type.
 *
 * Displays navigation for genres and media types, a grid of movies or TV shows based on the selected filters, and pagination controls. Loading states are handled using React Suspense with appropriate skeleton or spinner fallbacks.
 *
 * @param props - Contains a `searchParams` promise with optional `genreId`, `page`, and `mediaType` parameters.
 */
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
  const mediaType = (searchParams.mediaType ?? 'movie') as 'movie' | 'tv';

  return (
    <>
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>

        <SkipToElement elementId="content-container">
          Skip to content
        </SkipToElement>
      </div>

      <div className="relative mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <Suspense fallback={<AvailableGenresNavigation.Skeleton />}>
            <AvailableGenresNavigation
              currentGenreId={genreId}
              mediaType={mediaType}
            />
          </Suspense>
        </div>

        <MediaTypeSelector currentMediaType={mediaType} />
      </div>

      <div
        id="content-container"
        tabIndex={0}
        className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <Suspense
          fallback={
            mediaType === 'movie' ? <Movies.Skeletons /> : <TvShows.Skeletons />
          }
        >
          {mediaType === 'movie' ? (
            <Movies currentGenreId={genreId} currentPage={page} />
          ) : (
            <TvShows currentGenreId={genreId} currentPage={page} />
          )}
        </Suspense>
      </div>

      <Suspense fallback={<Spinner className="mx-auto mt-8" />}>
        <Pagination
          currentGenreId={genreId}
          currentPage={page}
          mediaType={mediaType}
        />
      </Suspense>
    </>
  );
}
