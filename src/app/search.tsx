import { createFileRoute } from '@tanstack/react-router';

import { getUser } from '@/lib/auth-server';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import {
  getSearchMovies,
  getSearchMulti,
  getSearchPersons,
  getSearchTvShows,
  type SearchMoviesResult,
  type SearchMultiResult,
  type SearchPersonsResult,
  type SearchTvShowsResult,
} from '@/lib/search';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchContent } from './search/search-content';

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) ?? '',
    page: Number(search.page ?? 1),
    mediaType: (search.mediaType as string) ?? 'all',
  }),
  loader: async ({ search }) => {
    const { q: query, page, mediaType } = search;

    const user = await getUser();
    const queryClient = getQueryClient();

    if (query) {
      if (mediaType === 'movie') {
        await queryClient.prefetchQuery<SearchMoviesResult>({
          queryKey: queryKeys.search.movies(query, page),
          queryFn: () => getSearchMovies(query, page),
        });
      } else if (mediaType === 'tv') {
        await queryClient.prefetchQuery<SearchTvShowsResult>({
          queryKey: queryKeys.search.tvShows(query, page),
          queryFn: () => getSearchTvShows(query, page),
        });
      } else if (mediaType === 'person') {
        await queryClient.prefetchQuery<SearchPersonsResult>({
          queryKey: queryKeys.search.persons(query, page),
          queryFn: () => getSearchPersons(query, page),
        });
      } else {
        await queryClient.prefetchQuery<SearchMultiResult>({
          queryKey: queryKeys.search.multi(query, page),
          queryFn: () => getSearchMulti(query, page),
        });
      }
    }

    return { dehydratedState: dehydrate(queryClient), userId: user?.id };
  },
  component: SearchPage,
});

function SearchPage() {
  const { dehydratedState, userId } = Route.useLoaderData();

  return (
    <HydrationBoundary state={dehydratedState}>
      <SearchContent userId={userId} />
    </HydrationBoundary>
  );
}
