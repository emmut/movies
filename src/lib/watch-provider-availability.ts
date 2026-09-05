import 'server-only';
import { sql, SQL } from 'drizzle-orm';

import { listItems } from '@/db/schema/lists';
import { titleAvailability } from '@/db/schema/titles';
import { db } from '@/lib/db';
import { DEFAULT_REGION } from '@/lib/regions';
import {
  mapWithConcurrency,
  selectTitlesNeedingAvailability,
  syncTitleAvailability,
} from '@/lib/title-sync';
import { appTitleSource } from '@/lib/title-sync-server';
import { WatchProviderFilter, watchProviderFilterSchema } from '@/lib/validations';

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

/**
 * SQL predicate on `list_items`: the row's title can be streamed (flatrate or
 * free) on any of the filter's providers in the filter's region, per the
 * locally cached availability. Person rows never match — they have no
 * availability rows. Compose it into a query's `where` alongside the list
 * scope so counting and paging happen in the database.
 */
export function streamableOnProviders(filter: WatchProviderFilter): SQL {
  return sql`exists (
    select 1 from ${titleAvailability}
    where ${titleAvailability.mediaType} = ${listItems.resourceType}
      and ${titleAvailability.tmdbId} = ${listItems.resourceId}
      and ${titleAvailability.region} = ${filter.region}
      and ${titleAvailability.providerId} = any(${sql.param(filter.providerIds)}::integer[])
      and ${titleAvailability.offerType} in ('flatrate', 'free')
  )`;
}

// Caps concurrent TMDB availability lookups so a large list whose titles were
// added before the cache existed doesn't fire hundreds of requests at once
// (tmdbFetch retries but has no concurrency limit of its own).
const MAX_CONCURRENT_SYNCS = 10;

/**
 * Makes sure every movie/TV row in `scope` has known availability before a
 * provider filter runs against it. Titles added through the app are written
 * through on add, so this normally finds nothing; it catches up on rows that
 * predate the cache, syncing each once. A failed lookup throws (after
 * tmdbFetch's own retries) instead of silently treating the title as
 * unavailable, so an outage can't render a populated list as "no matches".
 *
 * @param scope - Narrows the `list_items` rows (joined with `lists`) to check.
 * @returns How many titles had to be synced.
 */
export async function ensureAvailabilityKnown(scope: SQL | undefined) {
  const missing = await selectTitlesNeedingAvailability(db, { scope });

  await mapWithConcurrency(missing, MAX_CONCURRENT_SYNCS, (key) =>
    syncTitleAvailability(db, appTitleSource, key),
  );

  return missing.length;
}
