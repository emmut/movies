import 'server-only';

import { getUserRegion, getUserWatchProviders, getWatchProviders } from '@/lib/user-actions';

/**
 * Resolves what a list page needs to render the stream-provider filter: the
 * effective region (URL override, else the user's stored region) and the
 * providers available to pick from in that region. The independent lookups
 * run in parallel.
 *
 * `availableWatchProviders` is returned as a promise so the dropdown lookup
 * runs alongside the caller's data fetches instead of gating them.
 */
export async function getWatchProviderFilterContext(watchRegionParam: string | null) {
  const [userRegion, userWatchProviders] = await Promise.all([
    watchRegionParam ?? getUserRegion(),
    getUserWatchProviders(),
  ]);

  return {
    userRegion,
    availableWatchProviders: getWatchProviders(userRegion, userWatchProviders),
  };
}
