'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { getUserRegion } from '@/lib/user-actions';

/**
 * Resolves the signed-in user's region on the client.
 *
 * Returns the default region for anonymous users (handled server-side by {@link getUserRegion}).
 * Used to personalize prerendered, default-region content after hydration without reading the
 * session during the server render.
 */
export function useUserRegion() {
  return useQuery({
    queryKey: queryKeys.user.region(),
    queryFn: () => getUserRegion(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
