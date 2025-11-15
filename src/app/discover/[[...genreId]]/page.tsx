import { AvailableGenresNavigation } from '@/components/available-genre-navigation';
import { getUser } from '@/lib/auth-server';
import { getDiscoverMedia } from '@/lib/discover-client';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import {
  getUserRegion,
  getUserWatchProviders,
  getWatchProviders,
} from '@/lib/user-actions';
import {
  getWatchProvidersString,
  loadWatchProviderSearchParams,
} from '@/lib/watch-provider-search-params';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DiscoverContent } from './discover-content';

type DiscoverWithGenreParams = {
  searchParams: Promise<{
    page?: string;
    genreId?: string;
    mediaType?: string;
    sort_by?: string;
    with_watch_providers?: string;
    watch_region?: string;
    with_runtime_lte?: string;
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

  const user = await getUser();
  const userWatchProviders = await getUserWatchProviders();

  const { with_watch_providers, watch_region } =
    loadWatchProviderSearchParams(searchParams);
  const watchRegion = watch_region ?? (await getUserRegion());

  const filteredWatchProviders = await getWatchProviders(
    watchRegion,
    userWatchProviders
  );

  const watchProviders = getWatchProvidersString(
    with_watch_providers,
    userWatchProviders
  );

  // Prefetch data on the server for React Query
  const queryClient = getQueryClient();

  // Derive runtime filter from URL
  const runtimeLte = searchParams.with_runtime_lte
    ? Number(searchParams.with_runtime_lte)
    : undefined;

  await queryClient.prefetchQuery({
    queryKey:
      mediaType === 'movie'
        ? queryKeys.discover.movies({
            genreId,
            page,
            sortBy,
            watchProviders,
            watchRegion,
            withRuntimeLte: runtimeLte,
          })
        : queryKeys.discover.tvShows({
            genreId,
            page,
            sortBy,
            watchProviders,
            watchRegion,
            withRuntimeLte: runtimeLte,
          }),
    queryFn: () =>
      getDiscoverMedia(
        mediaType,
        genreId,
        page,
        sortBy,
        watchProviders,
        watchRegion,
        runtimeLte
      ),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DiscoverContent
        filteredWatchProviders={filteredWatchProviders}
        userRegion={watchRegion}
        userId={user?.id}
        genreNavigation={
          <Suspense fallback={<AvailableGenresNavigation.Skeleton />}>
            <AvailableGenresNavigation mediaType={mediaType} />
          </Suspense>
        }
      />
    </HydrationBoundary>
  );
}
