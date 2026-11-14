import type { AppRouterClient } from '@movies/api/router';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useDiscoveryFacets(input: Parameters<AppRouterClient['discovery']['facets']>[0]) {
  return useQuery(
    orpc.discovery.facets.queryOptions({
      input,
      retry: false,
    }),
  );
}

export function useDiscoveryList(input: Parameters<AppRouterClient['discovery']['list']>[0]) {
  return useQuery(orpc.discovery.list.queryOptions({ input }));
}

export function useDiscoveryOptions(input: Parameters<AppRouterClient['discovery']['options']>[0]) {
  return useQuery(orpc.discovery.options.queryOptions({ input }));
}
