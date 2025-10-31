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
async function FiltersPanelWrapper({
  mediaType,
}: {
  mediaType: 'movie' | 'tv';
}) {
  const watchRegion = await getUserRegion();
  const userWatchProviders = await getUserWatchProviders();
  const filteredWatchProviders = await getWatchProviders(
    watchRegion,
    userWatchProviders
  );

  return (
    <FiltersPanel
      mediaType={mediaType}
      watchProviders={filteredWatchProviders}
      userRegion={watchRegion}
    />
  );
}

function FiltersPanelSkeleton() {
  return (
    <div className="mt-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-54 flex-col gap-2">
            <div className="h-4 w-16 animate-pulse rounded bg-neutral-50/10" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-50/10" />
          </div>

          <div className="flex min-w-64 flex-col gap-2">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-50/10" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-50/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const user = await getUser();
  const watchRegion = await getUserRegion();
  const userWatchProviders = await getUserWatchProviders();

  // Use user's preferred watch providers if none are specified in the URL
  const watchProviders =
    searchParams.with_watch_providers ||
    (userWatchProviders.length > 0 ? userWatchProviders.join('|') : undefined);

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

      <Suspense fallback={<FiltersPanelSkeleton />}>
        <FiltersPanelWrapper mediaType={mediaType} />
      </Suspense>

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
