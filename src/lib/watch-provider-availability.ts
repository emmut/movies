import 'server-only';

import { getMovieWatchProviders } from '@/lib/movies';
import { DEFAULT_REGION, RegionCode } from '@/lib/regions';
import { getTvShowWatchProviders } from '@/lib/tv-shows';
import { WatchProviderFilter, watchProviderFilterSchema } from '@/lib/validations';
import type { RegionWatchProviders } from '@/types/watch-provider';

type ListItemResource = {
  resourceId: number;
  resourceType: string;
};

/**
 * Normalizes the raw stream-provider filter input of a list query. Returns
 * `null` when no providers were requested (the filter is inactive); otherwise
 * validates the ids and region.
 *
 * @throws {ZodError} When providers are requested with malformed ids or an
 * unknown region.
 */
export function parseWatchProviderFilter(
  providerIds?: number[],
  region?: string,
): WatchProviderFilter | null {
  if (!providerIds || providerIds.length === 0) {
    return null;
  }

  return watchProviderFilterSchema.parse({ providerIds, region: region ?? DEFAULT_REGION });
}

/** Provider ids a title can be streamed on (flatrate or free) in a region. */
function streamableProviderIds(regionProviders: RegionWatchProviders | undefined) {
  const offers = [...(regionProviders?.flatrate ?? []), ...(regionProviders?.free ?? [])];
  return offers.map((provider) => provider.provider_id);
}

async function fetchRegionProviders(resourceType: 'movie' | 'tv', resourceId: number, region: string) {
  const providers =
    resourceType === 'movie'
      ? await getMovieWatchProviders(resourceId)
      : await getTvShowWatchProviders(resourceId);

  return providers.results?.[region as RegionCode];
}

/**
 * Whether a list item can be streamed on any of the filter's providers in the
 * filter's region. Person rows never match. A failed provider lookup throws
 * (after tmdbFetch's own retries) instead of silently reporting the title as
 * unavailable, so an outage can't render a populated list as "no matches".
 */
export async function matchesWatchProviders(row: ListItemResource, filter: WatchProviderFilter) {
  if (row.resourceType !== 'movie' && row.resourceType !== 'tv') {
    return false;
  }

  const regionProviders = await fetchRegionProviders(
    row.resourceType,
    row.resourceId,
    filter.region,
  );
  return streamableProviderIds(regionProviders).some((id) => filter.providerIds.includes(id));
}

// Caps concurrent TMDB availability lookups so a large list with a cold cache
// doesn't fire hundreds of requests at once (tmdbFetch retries but has no
// concurrency limit of its own).
const MAX_CONCURRENT_LOOKUPS = 10;

/**
 * Keeps the rows streamable on any of the filter's providers, preserving the
 * input order. Lookups run in bounded batches and are cached for days, so
 * filtering a whole list stays cheap on a warm cache.
 */
export async function filterRowsByWatchProviders<T extends ListItemResource>(
  rows: T[],
  filter: WatchProviderFilter,
): Promise<T[]> {
  // ponytail: batch barrier, not a work pool — swap in a pool if list sizes
  // make the slowest-in-batch stalls matter.
  const matches: boolean[] = [];
  for (let i = 0; i < rows.length; i += MAX_CONCURRENT_LOOKUPS) {
    const batch = rows.slice(i, i + MAX_CONCURRENT_LOOKUPS);
    matches.push(...(await Promise.all(batch.map((row) => matchesWatchProviders(row, filter)))));
  }

  return rows.filter((_, index) => matches[index]);
}
