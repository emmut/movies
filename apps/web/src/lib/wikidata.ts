import 'server-only';
import { cacheLife } from 'next/cache';
import { z } from 'zod';

import { watchLinkFallbackRegions } from '@/lib/provider-link-sources';
import { getTmdbExternalIds } from '@/lib/tmdb-external-ids';
import {
  canonicalWikidataItem,
  matchesWikidataIdentity,
  wikidataIdentitySearch,
} from '@/lib/wikidata-identity';
import { buildWikidataWatchLinks } from '@/lib/wikidata-watch-links';
import type { DirectWatchLink } from '@/types/watch-provider';

const itemIdSchema = z.string().regex(/^Q[1-9]\d*$/);
const claimsSchema = z.record(z.string(), z.unknown());

class WikidataHttpError extends Error {
  constructor(readonly status: number) {
    super('Wikidata request failed');
  }
}

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
  if (!response.ok) throw new WikidataHttpError(response.status);
  return response.json() as Promise<unknown>;
}

async function getEntityClaims(itemId: string) {
  'use cache: remote';
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const data = z
    .object({ entities: z.record(z.string(), z.unknown()), redirects: z.unknown().optional() })
    .parse(
      await request({ action: 'wbgetentities', ids: itemId, props: 'claims', redirects: 'yes' }),
    );
  const canonical = canonicalWikidataItem(itemId, data.redirects);
  return z.object({ claims: claimsSchema }).parse(data.entities[canonical]).claims;
}

async function getClaimsByIdentity(type: 'movie' | 'tv', id: number, imdbId: string | null) {
  'use cache: remote';
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  const data = z
    .object({ query: z.object({ search: z.array(z.object({ title: itemIdSchema })) }) })
    .parse(
      await request({
        action: 'query',
        list: 'search',
        srnamespace: '0',
        srsearch: wikidataIdentitySearch(type, id, imdbId),
        srlimit: '2',
      }),
    );
  if (data.query.search.length !== 1) return null;
  const claims = await getEntityClaims(data.query.search[0].title);
  // Search is only discovery: require an exact, non-deprecated ID in the correct movie/TV namespace.
  return matchesWikidataIdentity(claims, type, id, imdbId) ? claims : null;
}

/** Fetch once and evaluate local/US/GB identities. Foreign candidates stay scoped until explicitly labelled as fallbacks. */
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
      : await getClaimsByIdentity(type, id, externalIds.imdb_id);
    // Evaluate dates outside the raw-claims cache; yesterday's valid link can expire today.
    const today = new Date().toISOString().slice(0, 10);
    return claims
      ? [region, ...watchLinkFallbackRegions(region)].flatMap((country) =>
          buildWikidataWatchLinks(claims, type, country, today),
        )
      : [];
  } catch (error) {
    // Public resource IDs/status codes only: never log upstream bodies or arbitrary error messages.
    console.warn('Wikidata title links unavailable; using TMDB watch options.', {
      type,
      id,
      reason: error instanceof WikidataHttpError ? 'http' : 'request_or_data',
      status: error instanceof WikidataHttpError ? error.status : undefined,
    });
    return [];
  }
}
