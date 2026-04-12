import { createFileRoute } from '@tanstack/react-router';

import { GenreNavigationClient } from '@/components/genre-navigation-client';
import { getUser } from '@/lib/auth-server';
import { getDiscoverMedia } from '@/lib/discover-client';
import { fetchAvailableGenres } from '@/lib/movies';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { fetchAvailableTvGenres } from '@/lib/tv-shows';
import { getUserRegion, getUserWatchProviders, getWatchProviders } from '@/lib/user-actions';
import { getWatchProvidersString } from '@/lib/watch-provider-search-params';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { DiscoverContent } from './discover/[[...genreId]]/discover-content';

export const Route = createFileRoute('/discover')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
    genreId: search.genreId !== undefined ? Number(search.genreId) : 0,
    mediaType: (search.mediaType as 'movie' | 'tv') ?? 'movie',
    sort_by: (search.sort_by as string) ?? 'popularity.desc',
    with_watch_providers: search.with_watch_providers
      ? String(search.with_watch_providers).split(',').map(Number)
      : ([] as number[]),
    watch_region: search.watch_region as string | undefined,
    runtime: search.runtime !== undefined ? Number(search.runtime) : undefined,
  }),
  loader: async ({ search }) => {
    const {
      page,
      genreId,
      mediaType,
      sort_by: sortBy,
      with_watch_providers,
      watch_region,
      runtime,
    } = search;

    const user = await getUser();
    const userWatchProviders = await getUserWatchProviders();
    const watchRegion = watch_region ?? (await getUserRegion());
    const withRuntimeLte = runtime ?? undefined;

    const [filteredWatchProviders, genres] = await Promise.all([
      getWatchProviders(watchRegion, userWatchProviders),
      mediaType === 'movie' ? fetchAvailableGenres() : fetchAvailableTvGenres(),
    ]);

    const watchProviders = getWatchProvidersString(with_watch_providers, userWatchProviders);

    const queryClient = getQueryClient();

    await queryClient.prefetchQuery({
      queryKey:
        mediaType === 'movie'
          ? queryKeys.discover.movies({
              genreId,
              page,
              sortBy,
              watchProviders,
              watchRegion,
              withRuntimeLte,
            })
          : queryKeys.discover.tvShows({
              genreId,
              page,
              sortBy,
              watchProviders,
              watchRegion,
              withRuntimeLte,
            }),
      queryFn: () =>
        getDiscoverMedia(
          mediaType,
          genreId,
          page,
          sortBy,
          watchProviders,
          watchRegion,
          withRuntimeLte,
        ),
    });

    return {
      dehydratedState: dehydrate(queryClient),
      filteredWatchProviders,
      genres,
      userRegion: watchRegion,
      userId: user?.id,
      mediaType,
    };
  },
  component: DiscoverPage,
});

function DiscoverPage() {
  const { dehydratedState, filteredWatchProviders, genres, userRegion, userId, mediaType } =
    Route.useLoaderData();

  return (
    <HydrationBoundary state={dehydratedState}>
      <DiscoverContent
        filteredWatchProviders={filteredWatchProviders}
        userRegion={userRegion}
        userId={userId}
        genreNavigation={<GenreNavigationClient genres={genres} mediaType={mediaType} />}
      />
    </HydrationBoundary>
  );
}
