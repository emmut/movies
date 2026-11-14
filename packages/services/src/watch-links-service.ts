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

export function createWatchLinksService(
  fetchTmdb: TmdbFetch,
  fetchEntity: typeof fetch = fetch,
): Pick<CatalogService, 'watchLinks'> {
  return {
    async watchLinks({ id, type }) {
      // Optional enhancement: a failure must never hide regional availability.
      try {
        const external = externalIds.parse(await fetchTmdb(`/${type}/${id}/external_ids`));
        if (!external.wikidata_id) {
          return [];
        }
        const url = new URL('https://www.wikidata.org/w/api.php');
        url.search = new URLSearchParams({
          action: 'wbgetentities',
          ids: external.wikidata_id,
          props: 'claims',
          format: 'json',
          maxlag: '5',
        }).toString();
        const response = await fetchEntity(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'Movies/1.0 (https://github.com/emmut/movies; streaming title identifiers)',
          },
          signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) {
          return [];
        }
        const data = responseSchema.parse(await response.json());
        return buildWikidataWatchLinks(data.entities[external.wikidata_id].claims, type);
      } catch {
        return [];
      }
    },
  };
}
