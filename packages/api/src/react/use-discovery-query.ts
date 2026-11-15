'use client';

import { useApi } from '@movies/api/react';
import type { AppRouterClient } from '@movies/api/router';
import { useQuery } from '@tanstack/react-query';

export function useDiscoveryFacets(
  input: Parameters<AppRouterClient['discovery']['facets']>[0],
  enabled = true,
) {
  const orpc = useApi();
  return useQuery(
    orpc.discovery.facets.queryOptions({
      input,
      enabled,
      retry: false,
    }),
  );
}

export function useDiscoveryList(input: Parameters<AppRouterClient['discovery']['list']>[0]) {
  const orpc = useApi();
  return useQuery(orpc.discovery.list.queryOptions({ input }));
}

export function useDiscoveryOptions(
  input: Parameters<AppRouterClient['discovery']['options']>[0],
  enabled = true,
) {
  const orpc = useApi();
  return useQuery(orpc.discovery.options.queryOptions({ input, enabled }));
}
