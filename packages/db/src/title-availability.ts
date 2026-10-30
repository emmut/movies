import 'server-only';
import type { WatchProviderFilter } from '@movies/api/validations';
import { listItems } from '@movies/db/schema/lists';
import { titleAvailability } from '@movies/db/schema/titles';
import { and, eq, exists, inArray, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { QueryBuilder } from 'drizzle-orm/pg-core';

import {
  mapWithConcurrency,
  selectTitlesNeedingAvailability,
  syncTitleAvailability,
  type TitleSource,
} from './title-sync';

const STREAMABLE_OFFER_TYPES = ['flatrate', 'free'] as const;

const queryBuilder = new QueryBuilder();

/** List items streamable (subscription or free) on any of the filter's providers. */
export function streamableOnProviders(filter: WatchProviderFilter): SQL {
  const matchingOffers = queryBuilder
    .select({ tmdbId: titleAvailability.tmdbId })
    .from(titleAvailability)
    .where(
      and(
        eq(titleAvailability.mediaType, listItems.resourceType),
        eq(titleAvailability.tmdbId, listItems.resourceId),
        eq(titleAvailability.region, filter.region),
        inArray(titleAvailability.providerId, filter.providerIds),
        inArray(titleAvailability.offerType, STREAMABLE_OFFER_TYPES),
      ),
    );
  return exists(matchingOffers);
}

/** Unknown is different from unavailable. A failed catch-up lookup fails the filtered read. */
export async function ensureTitleAvailability(
  db: NodePgDatabase,
  source: TitleSource,
  scope: SQL | undefined,
) {
  const missing = await selectTitlesNeedingAvailability(db, { scope });
  await mapWithConcurrency(missing, 10, (key) => syncTitleAvailability(db, source, key));
  return missing.length;
}
