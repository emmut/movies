import type { AppRouterClient } from '@movies/api/router';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useSearchList(input: Parameters<AppRouterClient['search']['list']>[0]) {
  return useQuery(orpc.search.list.queryOptions({ input }));
}

export function useSearchSuggestions(
  input: Parameters<AppRouterClient['search']['suggestions']>[0],
  enabled: boolean,
) {
  return useQuery(
    orpc.search.suggestions.queryOptions({
      input,
      enabled,
      retry: false,
    }),
  );
}
