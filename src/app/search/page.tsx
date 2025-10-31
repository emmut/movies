import { getUser } from '@/lib/auth-server';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import {
  getSearchMovies,
  getSearchMulti,
  getSearchPersons,
  getSearchTvShows,
  SearchResult,
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
    await queryClient.prefetchQuery<SearchResult>({
      queryKey:
        mediaType === 'movie'
          ? queryKeys.search.movies(query, page)
          : mediaType === 'tv'
            ? queryKeys.search.tvShows(query, page)
            : mediaType === 'person'
              ? queryKeys.search.persons(query, page)
              : queryKeys.search.multi(query, page),
      queryFn: () => {
        if (mediaType === 'movie') {
          return getSearchMovies(query, page);
        } else if (mediaType === 'tv') {
          return getSearchTvShows(query, page);
        } else if (mediaType === 'person') {
          return getSearchPersons(query, page);
        } else {
          return getSearchMulti(query, page);
        }
      },
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchContent userId={user?.id} />
    </HydrationBoundary>
  );
}
