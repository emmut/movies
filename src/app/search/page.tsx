import { getUser } from '@/lib/auth-server';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import {
  getSearchMovies,
  getSearchMulti,
  getSearchPersons,
  getSearchTvShows,
  SearchMoviesResult,
  SearchMultiResult,
  SearchPersonsResult,
  SearchTvShowsResult,
} from '@/lib/search';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchContent } from './search-content';

type MediaType = 'movie' | 'tv' | 'person' | 'all';

type SearchProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    mediaType?: string;
  }>;
};

/**
 * Displays the search page with results and pagination based on the provided search parameters.
 *
 * Supports searching for both movies and TV shows based on the mediaType parameter and applying sort filters.
 *
 * @param props - Contains a promise resolving to search parameters, including optional query, page, mediaType, and sort_by values.
 * @returns The rendered search page UI with results and pagination.
 */
export default async function SearchPage(props: SearchProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q ?? '';
  const page = Number(searchParams.page ?? '1');
  const mediaType = (searchParams.mediaType ?? 'all') as MediaType;

  const user = await getUser();

  // Prefetch data on the server for React Query
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchContent userId={user?.id} />
    </HydrationBoundary>
  );
}
