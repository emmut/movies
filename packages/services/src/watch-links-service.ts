import 'server-only';
import type { CatalogService } from '@movies/api/router';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { buildWikidataWatchLinks } from '@movies/api/wikidata-watch-links';
import { z } from 'zod';

const externalIds = z.object({
  wikidata_id: z
    .string()
    .regex(/^Q[1-9]\d*$/)
    .nullable(),
});
const responseSchema = z.object({
  entities: z.record(z.string(), z.object({ claims: z.record(z.string(), z.unknown()) })),
});

export type WikidataClaimsReader = (itemId: string) => Promise<Record<string, unknown>>;

/** The host may cache successful JSON claims; failures always remain retryable. */
export async function readWikidataClaims(itemId: string, fetchEntity: typeof fetch = fetch) {
  externalIds.shape.wikidata_id.unwrap().parse(itemId);
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'wbgetentities',
    ids: itemId,
    props: 'claims',
    format: 'json',
    maxlag: '5',
  }).toString();
  const response = await fetchEntity(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Movies/1.0 (https://github.com/emmut/movies; streaming title identifiers)',
    },
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) {
    throw new Error(`Wikidata request failed (${response.status})`);
  }
  const data = responseSchema.parse(await response.json());
  return data.entities[itemId].claims;
}

export function createWatchLinksService(
  fetchTmdb: TmdbFetch,
  fetchEntity: typeof fetch = fetch,
  readClaims: WikidataClaimsReader = (itemId) => readWikidataClaims(itemId, fetchEntity),
): Pick<CatalogService, 'watchLinks'> {
  return {
    async watchLinks({ id, type }) {
      // Optional enhancement: a failure must never hide regional availability.
      try {
        const external = externalIds.parse(await fetchTmdb(`/${type}/${id}/external_ids`));
        if (!external.wikidata_id) {
          return [];
        }
        return buildWikidataWatchLinks(await readClaims(external.wikidata_id), type);
      } catch {
        return [];
      }
    },
  };
}
