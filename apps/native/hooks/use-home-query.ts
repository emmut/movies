import type { AppRouterClient } from '@movies/api/router';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useHomeList(input: Parameters<AppRouterClient['home']['list']>[0]) {
  return useQuery(orpc.home.list.queryOptions({ input }));
}

export function useHomeTrending(input: Parameters<AppRouterClient['home']['trending']>[0]) {
  return useQuery(orpc.home.trending.queryOptions({ input }));
}
