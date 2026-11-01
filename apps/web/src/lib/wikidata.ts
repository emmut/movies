import 'server-only';
import { cacheLife } from 'next/cache';
import { z } from 'zod';

import { getTmdbExternalIds } from '@/lib/tmdb-external-ids';
import { buildWikidataWatchLinks } from '@/lib/wikidata-watch-links';
import type { DirectWatchLink } from '@/types/watch-provider';

const itemIdSchema = z.string().regex(/^Q[1-9]\d*$/);
const entitySchema = z.object({ claims: z.record(z.string(), z.unknown()) });

async function getWikidataId(type: 'movie' | 'tv', id: number) {
  const data = await getTmdbExternalIds(type, id);
  const parsed = itemIdSchema.safeParse(data.wikidata_id);
  return parsed.success ? parsed.data : null;
}

async function getEntityLinks(itemId: string, type: 'movie' | 'tv') {
  'use cache: remote';
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'wbgetentities',
    ids: itemId,
    props: 'claims',
    format: 'json',
    maxlag: '5',
  }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Movies/1.0 (https://github.com/emmut/movies; streaming title identifiers)',
    },
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) {
    throw new Error(`Wikidata request failed (${response.status})`);
  }
  const data = z
    .object({ entities: z.record(z.string(), z.unknown()) })
    .parse(await response.json());
  const entity = entitySchema.parse(data.entities[itemId]);
  return buildWikidataWatchLinks(entity.claims, type);
}

/** Availability still comes from TMDB; Wikidata only supplies optional title identifiers. */
export async function getWikidataWatchLinks(
  type: 'movie' | 'tv',
  id: number,
): Promise<DirectWatchLink[]> {
  try {
    const itemId = await getWikidataId(type, id);
    return itemId ? await getEntityLinks(itemId, type) : [];
  } catch {
    // Catch outside the cached functions so transient failures can be retried.
    console.warn('Wikidata title links unavailable; using TMDB watch options.');
    return [];
  }
}
