
import { useQuery } from '@tanstack/react-query';
import { orpc } from '@/utils/orpc';
import type { SearchMoviesResult, SearchMultiResult, SearchPersonsResult, SearchTvShowsResult } from '@movies/api/lib/search';

type UseSearchParams = {
  query: string;
  page: number;
  enabled?: boolean;
};

export function useSearchMovies({ query, page, enabled = true }: UseSearchParams) {
  return useQuery({
    ...orpc.search.movies.queryOptions({ input: { query, page } }),
    enabled: query.length > 0 && enabled,
  });
}

export function useSearchTvShows({ query, page, enabled = true }: UseSearchParams) {
  return useQuery({
    ...orpc.search.tv.queryOptions({ input: { query, page } }),
    enabled: query.length > 0 && enabled,
  });
}

export function useSearchPersons({ query, page, enabled = true }: UseSearchParams) {
  return useQuery({
    ...orpc.search.persons.queryOptions({ input: { query, page } }),
    enabled: query.length > 0 && enabled,
  });
}

export function useSearchMulti({ query, page, enabled = true }: UseSearchParams) {
  return useQuery({
    ...orpc.search.multi.queryOptions({ input: { query, page } }),
    enabled: query.length > 0 && enabled,
  });
}

export type { SearchMoviesResult, SearchMultiResult, SearchPersonsResult, SearchTvShowsResult };
