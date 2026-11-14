import 'server-only';
import { discoveryChoice, type DiscoveryFacetInput } from '@movies/api/discover';
import { loadNetworkCatalog, searchNetworkCatalog } from '@movies/api/network-catalog';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { z } from 'zod';

/** A failed refresh is retried on the next search rather than cached as an empty catalogue. */
export function createDiscoveryFacetService(
  fetchTmdb: TmdbFetch,
  loadNetworks = loadNetworkCatalog,
) {
  let catalog: Promise<z.infer<typeof discoveryChoice>[]> | undefined;
  let expires = 0;
  async function networks() {
    if (!catalog || Date.now() >= expires) {
      expires = Date.now() + 86_400_000;
      catalog = loadNetworks().catch((error) => {
        catalog = undefined;
        throw error;
      });
    }
    return catalog;
  }
  return async function facets({ kind, query, ids }: DiscoveryFacetInput) {
    const selectedIds = [...new Set(ids)];
    const selected = await Promise.all(
      selectedIds.map(async (id) => {
        try {
          const item = discoveryChoice.parse(await fetchTmdb(`/${kind}/${id}`));
          if (item.id !== id) {
            throw new Error('Upstream identifier mismatch');
          }
          return item;
        } catch {
          return { id, name: `${kind[0].toUpperCase()}${kind.slice(1)} ${id}` };
        }
      }),
    );
    if (query.length < 2) {
      return selected;
    }
    let matches;
    if (kind === 'network') {
      matches = searchNetworkCatalog(await networks(), query);
    } else {
      const response = await fetchTmdb(`/search/${kind}`, { searchParams: { query, page: 1 } });
      matches = z
        .object({ results: z.array(discoveryChoice) })
        .parse(response)
        .results.slice(0, 20);
    }
    return [...selected, ...matches.filter((item) => !selectedIds.includes(item.id))];
  };
}
