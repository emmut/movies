'use client';

import { useApi } from '@movies/api/react';
import type { AppRouterClient } from '@movies/api/router';
import { useQuery } from '@tanstack/react-query';

export function useSearchList(input: Parameters<AppRouterClient['search']['list']>[0]) {
  const orpc = useApi();
  return useQuery(orpc.search.list.queryOptions({ input, enabled: input.query.trim().length > 0 }));
}

export function useSearchSuggestions(
  input: Parameters<AppRouterClient['search']['suggestions']>[0],
  enabled: boolean,
) {
  const orpc = useApi();
  return useQuery(
    orpc.search.suggestions.queryOptions({
      input,
      enabled,
      retry: false,
    }),
  );
}
