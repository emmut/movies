'use client';

import { useApi } from '@movies/api/react';
import type { AppRouterClient } from '@movies/api/router';
import { useQuery } from '@tanstack/react-query';

export function useHomeList(input: Parameters<AppRouterClient['home']['list']>[0]) {
  const orpc = useApi();
  return useQuery(orpc.home.list.queryOptions({ input }));
}

export function useHomeTrending(input: Parameters<AppRouterClient['home']['trending']>[0]) {
  const orpc = useApi();
  return useQuery(orpc.home.trending.queryOptions({ input }));
}
