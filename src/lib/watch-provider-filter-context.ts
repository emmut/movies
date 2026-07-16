import 'server-only';

import { getUserRegion, getUserWatchProviders, getWatchProviders } from '@/lib/user-actions';

/**
 * Resolves what a list page needs to render the stream-provider filter: the
 * effective region (URL override, else the user's stored region) and the
 * providers available to pick from in that region. The independent lookups
 * run in parallel.
 */
export async function getWatchProviderFilterContext(watchRegionParam: string | null) {
  const [userRegion, userWatchProviders] = await Promise.all([
    watchRegionParam ?? getUserRegion(),
    getUserWatchProviders(),
  ]);

  const availableWatchProviders = await getWatchProviders(userRegion, userWatchProviders);

  return { userRegion, availableWatchProviders };
}
