import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { getUser } from '@/lib/auth-server';
import { getOriginCountryString } from '@/lib/countries';
import { getDiscoverMedia } from '@/lib/discover-client';
import { loadDiscoverSearchParams } from '@/lib/discover-search-params';
import { fetchAvailableGenres } from '@/lib/movies';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { fetchAvailableTvGenres } from '@/lib/tv-shows';
import { getUserRegion, getUserWatchProviders, getWatchProviders } from '@/lib/user-actions';
import { getWatchProvidersString } from '@/lib/watch-provider-search-params';

import { DiscoverContent } from './discover-content';

type DiscoverWithGenreParams = {
  searchParams: Promise<{
    page?: string;
    genreId?: string;
    mediaType?: string;
    sort_by?: string;
    with_watch_providers?: string;
    with_origin_country?: string;
    watch_region?: string;
    runtime?: string;
  }>;
};

type DiscoverQueryParams = Awaited<ReturnType<typeof loadDiscoverSearchParams>> & {
  watchProviders?: string;
  watchRegion: string;
  withRuntimeLte?: number;
  withOriginCountry?: string;
};

function getDiscoverQueryKey({
  mediaType,
  genreIds,
  page,
  sort_by: sortBy,
  watchProviders,
  watchRegion,
  withRuntimeLte,
  withOriginCountry,
}: DiscoverQueryParams) {
  const params = {
    genreIds,
    page,
    sortBy,
    watchProviders,
    watchRegion,
    withRuntimeLte,
    withOriginCountry,
  };

  return mediaType === 'movie'
    ? queryKeys.discover.movies(params)
    : queryKeys.discover.tvShows(params);
}

async function prefetchDiscoverMedia(queryClient: QueryClient, params: DiscoverQueryParams) {
  await queryClient.prefetchQuery({
    queryKey: getDiscoverQueryKey(params),
    queryFn: () =>
      getDiscoverMedia(
        params.mediaType,
        params.genreIds,
        params.page,
        params.sort_by,
        params.watchProviders,
        params.watchRegion,
        params.withRuntimeLte,
        params.withOriginCountry,
      ),
  });
}

/**
 * Renders a media discovery page filtered by genre, page number, media type, and other filters.
 *
 * Displays navigation for genres and media types, filter controls, a grid of movies or TV shows based on the selected filters, and pagination controls. Loading states are handled using React Suspense with appropriate skeleton or spinner fallbacks.
 *
 * @param props - Contains a `searchParams` promise with optional filter parameters.
 */
export default async function DiscoverWithGenrePage(props: DiscoverWithGenreParams) {
  const searchParams = await props.searchParams;
  const discoverParams = loadDiscoverSearchParams(searchParams);

  const [user, userWatchProviders, userRegion, movieGenres, tvGenres] = await Promise.all([
    getUser(),
    getUserWatchProviders(),
    getUserRegion(),
    fetchAvailableGenres(),
    fetchAvailableTvGenres(),
  ]);
  const watchRegion = discoverParams.watch_region ?? userRegion;

  const watchProviders = getWatchProvidersString(
    discoverParams.with_watch_providers,
    userWatchProviders,
  );

  // Prefetch data on the server for React Query
  const queryClient = getQueryClient();
  const [filteredWatchProviders] = await Promise.all([
    getWatchProviders(watchRegion, userWatchProviders),
    prefetchDiscoverMedia(queryClient, {
      ...discoverParams,
      watchProviders,
      watchRegion,
      withRuntimeLte: discoverParams.runtime ?? undefined,
      withOriginCountry: getOriginCountryString(discoverParams.with_origin_country),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DiscoverContent
        filteredWatchProviders={filteredWatchProviders}
        userRegion={watchRegion}
        userWatchProviders={userWatchProviders}
        userId={user?.id}
        movieGenres={movieGenres}
        tvGenres={tvGenres}
      />
    </HydrationBoundary>
  );
}
