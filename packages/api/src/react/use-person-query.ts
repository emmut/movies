'use client';

import { useApi } from '@movies/api/react';
import type { AppRouterClient } from '@movies/api/router';
import { useQuery } from '@tanstack/react-query';

export function usePersonCredits(input: Parameters<AppRouterClient['person']['credits']>[0]) {
  const orpc = useApi();
  return useQuery(orpc.person.credits.queryOptions({ input, retry: false }));
}

export function usePersonDetails(input: Parameters<AppRouterClient['person']['details']>[0]) {
  const orpc = useApi();
  return useQuery(orpc.person.details.queryOptions({ input, retry: false }));
}
