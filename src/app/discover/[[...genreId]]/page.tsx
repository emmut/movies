import { AvailableGenresNavigation } from '@/components/available-genre-navigation';
import DiscoverGrid from '@/components/discover-grid';
import FiltersPanel from '@/components/filters-panel';
import ItemGrid from '@/components/item-grid';
import MediaTypeSelector from '@/components/media-type-selector';
import SectionTitle from '@/components/section-title';
import SkipToElement from '@/components/skip-to-element';
import Spinner from '@/components/spinner';
import { getUser } from '@/lib/auth-server';
import {
  getUserRegion,
  getUserWatchProviders,
  getWatchProviders,
} from '@/lib/user-actions';
import { loadWatchProviderSearchParams } from '@/lib/watch-provider-search-params';
import { Suspense } from 'react';
import Pagination from './pagination';

type DiscoverWithGenreParams = {
  searchParams: Promise<{
    page?: string;
    genreId?: string;
    mediaType?: string;
    sort_by?: string;
    with_watch_providers?: string;
    watch_region?: string;
  }>;
};

/**
 * Renders a media discovery page filtered by genre, page number, media type, and other filters.
 *
 * Displays navigation for genres and media types, filter controls, a grid of movies or TV shows based on the selected filters, and pagination controls. Loading states are handled using React Suspense with appropriate skeleton or spinner fallbacks.
 *
 * @param props - Contains a `searchParams` promise with optional filter parameters.
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
  const sortBy = searchParams.sort_by;
  const watchRegion = await getUserRegion();

  const user = await getUser();

  const userWatchProviders = await getUserWatchProviders();
  const filteredWatchProviders = await getWatchProviders(
    watchRegion,
    userWatchProviders
  );

  const { with_watch_providers } =
    await loadWatchProviderSearchParams(searchParams);

  // Use user's preferred watch providers if none are specified in the URL
  const watchProviders =
    with_watch_providers.length > 0
      ? with_watch_providers.join('|')
      : userWatchProviders.length > 0
        ? userWatchProviders.join('|')
        : undefined;

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
              searchParams={searchParams}
            />
          </Suspense>
        </div>

        <MediaTypeSelector currentMediaType={mediaType} />
      </div>

      <div className="mt-6">
        <FiltersPanel
          mediaType={mediaType}
          watchProviders={filteredWatchProviders}
          userRegion={watchRegion}
        />
      </div>

      <div
        id="content-container"
        tabIndex={0}
        className="mt-7 grid scroll-m-5 grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <Suspense fallback={<ItemGrid.Skeletons className="w-full" />}>
          <DiscoverGrid
            currentGenreId={genreId}
            currentPage={page}
            mediaType={mediaType}
            sortBy={sortBy}
            watchProviders={watchProviders}
            watchRegion={watchRegion}
            userId={user?.id}
          />
        </Suspense>
      </div>

      <Suspense fallback={<Spinner className="mx-auto mt-8" />}>
        <Pagination
          currentGenreId={genreId}
          currentPage={page}
          mediaType={mediaType}
          sortBy={sortBy}
          watchProviders={watchProviders}
          watchRegion={watchRegion}
        />
      </Suspense>
    </>
  );
}
