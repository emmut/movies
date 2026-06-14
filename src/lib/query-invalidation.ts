import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from './query-keys';

type InvalidateOptions = {
  /**
   * Also invalidate the home-page list queries. Set this when the changed
   * preference affects what the homepage shows (e.g. region), since those lists
   * are keyed by region.
   */
  includeHomeLists?: boolean;
};

/**
 * Invalidates the client React Query cache after a user-preference change.
 *
 * Settings server actions revalidate server caches, but the in-memory React Query cache (region,
 * region-derived watch providers, and the region-keyed homepage lists) must be invalidated too —
 * otherwise client-side navigation keeps serving the old preference until the queries go stale.
 */
export async function invalidateUserPreferenceQueries(
  queryClient: QueryClient,
  { includeHomeLists = false }: InvalidateOptions = {},
) {
  const invalidations = [queryClient.invalidateQueries({ queryKey: queryKeys.user.all })];

  if (includeHomeLists) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.home.all }));
  }

  await Promise.all(invalidations);
}
