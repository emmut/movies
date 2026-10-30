import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';

import { getUser } from '@/lib/auth-server';
import { getOriginCountryString } from '@/lib/countries';
import { getDiscoverMedia } from '@/lib/discover-client';
import type { DiscoverParams } from '@/lib/discover-params';
import { loadDiscoverSearchParams } from '@/lib/discover-search-params';
import { fetchAvailableGenres } from '@/lib/movies';
import { getKeyword } from '@/lib/pdp';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { optional } from '@/lib/tmdb';
import { fetchAvailableTvGenres } from '@/lib/tv-shows';
import { getUserRegion, getUserWatchProviders, getWatchProviders } from '@/lib/user-actions';
import { getWatchProvidersString } from '@/lib/watch-provider-search-params';

import DiscoverLoading from '../loading';
import { DiscoverContent } from './discover-content';

type DiscoverWithGenreParams = {
  searchParams: Promise<{
    page?: string;
    genreId?: string;
    keywordId?: string;
    mediaType?: string;
    sort_by?: string;
    with_watch_providers?: string;
    with_origin_country?: string;
    watch_region?: string;
    runtime?: string;
  }>;
};

async function prefetchDiscoverMedia(
  queryClient: QueryClient,
  mediaType: 'movie' | 'tv',
  params: DiscoverParams,
) {
  await queryClient.prefetchQuery({
    queryKey:
      mediaType === 'movie'
        ? queryKeys.discover.movies(params)
        : queryKeys.discover.tvShows(params),
    queryFn: () => getDiscoverMedia(mediaType, params),
  });
}

/**
 * Renders a media discovery page filtered by genre, page number, media type, and other filters.
 *
 * Displays navigation for genres and media types, filter controls, a grid of movies or TV shows based on the selected filters, and pagination controls. Loading states are handled using React Suspense with appropriate skeleton or spinner fallbacks.
 *
 * @param props - Contains a `searchParams` promise with optional filter parameters.
 */
export default function DiscoverWithGenrePage(props: DiscoverWithGenreParams) {
  return (
    <Suspense fallback={<DiscoverLoading />}>
      <DiscoverWithGenre {...props} />
    </Suspense>
  );
}

async function DiscoverWithGenre(props: DiscoverWithGenreParams) {
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
  const [filteredWatchProviders, keywords] = await Promise.all([
    getWatchProviders(watchRegion, userWatchProviders),
    Promise.all(
      discoverParams.keywordIds.map(async (id) => {
        const keyword = await optional(getKeyword(id), null);
        return { id, name: keyword?.name ?? `Keyword ${id}` };
      }),
    ),
    prefetchDiscoverMedia(queryClient, discoverParams.mediaType, {
      genreIds: discoverParams.genreIds,
      keywordIds: discoverParams.keywordIds,
      page: discoverParams.page,
      sortBy: discoverParams.sort_by,
      watchProviders,
      watchRegion,
      withRuntimeLte: discoverParams.runtime ?? undefined,
      withOriginCountry: getOriginCountryString(discoverParams.with_origin_country),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DiscoverContent
        keywords={keywords}
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
