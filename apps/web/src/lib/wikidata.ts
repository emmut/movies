import 'server-only';
import { cacheLife } from 'next/cache';
import { z } from 'zod';

import { getTmdbExternalIds } from '@/lib/tmdb-external-ids';
import { buildWikidataWatchLinks } from '@/lib/wikidata-watch-links';
import type { DirectWatchLink } from '@/types/watch-provider';

const itemIdSchema = z.string().regex(/^Q[1-9]\d*$/);
const claimsSchema = z.record(z.string(), z.unknown());

async function request(params: Record<string, string>) {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.search = new URLSearchParams({ ...params, format: 'json', maxlag: '5' }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Movies/1.0 (https://github.com/emmut/movies; streaming title identifiers)',
    },
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error(`Wikidata request failed (${response.status})`);
  return response.json() as Promise<unknown>;
}

async function getEntityClaims(itemId: string) {
  'use cache: remote';
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const data = z
    .object({ entities: z.record(z.string(), z.unknown()) })
    .parse(await request({ action: 'wbgetentities', ids: itemId, props: 'claims' }));
  return z.object({ claims: claimsSchema }).parse(data.entities[itemId]).claims;
}

function hasExactTmdbId(claims: Record<string, unknown>, property: string, id: number) {
  const snak = z.object({
    rank: z.enum(['normal', 'preferred']),
    mainsnak: z.object({
      snaktype: z.literal('value'),
      datatype: z.literal('external-id'),
      datavalue: z.object({ value: z.string() }),
    }),
  });
  const values = claims[property];
  if (!Array.isArray(values)) return false;
  const identifiers = values.flatMap((value) => {
    const parsed = snak.safeParse(value);
    return parsed.success ? [parsed.data.mainsnak.datavalue.value] : [];
  });
  const unique = [...new Set(identifiers)];
  return unique.length === 1 && unique[0] === String(id);
}

async function getClaimsByTmdbId(type: 'movie' | 'tv', id: number) {
  'use cache: remote';
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const property = type === 'movie' ? 'P4947' : 'P4983';
  const data = z
    .object({ query: z.object({ search: z.array(z.object({ title: itemIdSchema })) }) })
    .parse(
      await request({
        action: 'query',
        list: 'search',
        srnamespace: '0',
        srsearch: `haswbstatement:${property}=${id}`,
        srlimit: '2',
      }),
    );
  if (data.query.search.length !== 1) return null;
  const claims = await getEntityClaims(data.query.search[0].title);
  // Search is only discovery: require an exact, non-deprecated ID in the correct movie/TV namespace.
  return hasExactTmdbId(claims, property, id) ? claims : null;
}

/** Availability comes from TMDB; Wikidata supplies identifiers/official title URLs without an API key. */
export async function getWikidataWatchLinks(
  type: 'movie' | 'tv',
  id: number,
  region: string,
): Promise<DirectWatchLink[]> {
  try {
    const externalIds = await getTmdbExternalIds(type, id);
    const itemId = itemIdSchema.safeParse(externalIds.wikidata_id);
    const claims = itemId.success
      ? await getEntityClaims(itemId.data)
      : await getClaimsByTmdbId(type, id);
    // Evaluate dates outside the raw-claims cache; yesterday's valid link can expire today.
    return claims
      ? buildWikidataWatchLinks(claims, type, region, new Date().toISOString().slice(0, 10))
      : [];
  } catch {
    console.warn('Wikidata title links unavailable; using TMDB watch options.');
    return [];
  }
}
