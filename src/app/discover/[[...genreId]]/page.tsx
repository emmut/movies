import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { getUser } from '@/lib/auth-server';
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
    watch_region?: string;
    runtime?: string;
  }>;
};

type DiscoverQueryParams = Awaited<ReturnType<typeof loadDiscoverSearchParams>> & {
  watchProviders?: string;
  watchRegion: string;
  withRuntimeLte?: number;
};

function getDiscoverQueryKey({
  mediaType,
  genreId,
  page,
  sort_by: sortBy,
  watchProviders,
  watchRegion,
  withRuntimeLte,
}: DiscoverQueryParams) {
  const params = { genreId, page, sortBy, watchProviders, watchRegion, withRuntimeLte };

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
        params.genreId,
        params.page,
        params.sort_by,
        params.watchProviders,
        params.watchRegion,
        params.withRuntimeLte,
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

  const user = await getUser();
  const userWatchProviders = await getUserWatchProviders();
  const watchRegion = discoverParams.watch_region ?? (await getUserRegion());

  const filteredWatchProviders = await getWatchProviders(watchRegion, userWatchProviders);
  const watchProviders = getWatchProvidersString(
    discoverParams.with_watch_providers,
    userWatchProviders,
  );
  const [movieGenres, tvGenres] = await Promise.all([
    fetchAvailableGenres(),
    fetchAvailableTvGenres(),
  ]);

  // Prefetch data on the server for React Query
  const queryClient = getQueryClient();
  await prefetchDiscoverMedia(queryClient, {
    ...discoverParams,
    watchProviders,
    watchRegion,
    withRuntimeLte: discoverParams.runtime ?? undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DiscoverContent
        filteredWatchProviders={filteredWatchProviders}
        userRegion={watchRegion}
        userId={user?.id}
        movieGenres={movieGenres}
        tvGenres={tvGenres}
      />
    </HydrationBoundary>
  );
}
