import 'server-only';
import type { WatchProviderFilter } from '@movies/api/validations';
import { listItems } from '@movies/db/schema/lists';
import { titleAvailability } from '@movies/db/schema/titles';
import { sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { mapWithConcurrency, selectTitlesNeedingAvailability, syncTitleAvailability, type TitleSource } from './title-sync';

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

/** Unknown is different from unavailable. A failed catch-up lookup fails the filtered read. */
export async function ensureTitleAvailability(db: NodePgDatabase, source: TitleSource, scope: SQL | undefined) {
  const missing = await selectTitlesNeedingAvailability(db, { scope });
  await mapWithConcurrency(missing, 10, (key) => syncTitleAvailability(db, source, key));
  return missing.length;
}
