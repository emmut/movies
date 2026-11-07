import 'server-only';
import { popcorntimeLinks, popcorntimeSnapshots } from '@movies/db/schema/popcorntime';
import { and, eq, gt, isNull, lte, or, sql } from 'drizzle-orm';
import { cacheLife } from 'next/cache';

import { db } from '@/lib/db';
import { POPCORNTIME_MAX_AGE_DAYS, popcorntimeWatchUrl } from '@/lib/popcorntime-contract';
import type { DirectWatchLink } from '@/types/watch-provider';

async function readLinks(type: 'movie' | 'tv', id: number): Promise<DirectWatchLink[]> {
  'use cache: remote';
  cacheLife({ stale: 300, revalidate: 1800, expire: 3600 });
  const rows = await db
    .select({
      providerId: popcorntimeLinks.providerId,
      region: popcorntimeLinks.region,
      offerType: popcorntimeLinks.offerType,
      token: popcorntimeLinks.linkToken,
    })
    .from(popcorntimeLinks)
    .innerJoin(popcorntimeSnapshots, eq(popcorntimeSnapshots.region, popcorntimeLinks.region))
    .where(
      and(
        eq(popcorntimeLinks.mediaType, type),
        eq(popcorntimeLinks.tmdbId, id),
        gt(
          popcorntimeSnapshots.publishedAt,
          sql`now() - ${POPCORNTIME_MAX_AGE_DAYS} * interval '1 day'`,
        ),
        or(
          isNull(popcorntimeLinks.availableFrom),
          lte(popcorntimeLinks.availableFrom, sql`current_date`),
        ),
        or(
          isNull(popcorntimeLinks.availableTo),
          gt(popcorntimeLinks.availableTo, sql`current_date`),
        ),
      ),
    );
  return rows.map((row) => ({
    providerId: row.providerId,
    regions: [row.region],
    types: [row.offerType],
    url: popcorntimeWatchUrl(row.token),
    source: 'popcorntime',
  }));
}

/** An absent import or unavailable database must never hide TMDB's offers. */
export async function getPopcorntimeWatchLinks(type: 'movie' | 'tv', id: number) {
  try {
    return await readLinks(type, id);
  } catch {
    console.warn('Popcorn Time title links unavailable; using other watch links.');
    return [];
  }
}
