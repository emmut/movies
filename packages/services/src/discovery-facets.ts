import 'server-only';
import { discoveryChoice, type DiscoveryFacetInput } from '@movies/api/discover';
import { loadNetworkCatalog, searchNetworkCatalog } from '@movies/api/network-catalog';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { z } from 'zod';

type DiscoveryChoice = z.infer<typeof discoveryChoice>;

const NETWORK_CATALOG_TTL_MS = 24 * 60 * 60 * 1000;
const SEARCH_MATCH_LIMIT = 20;
const choicesPageSchema = z.object({ results: z.array(discoveryChoice) });

function placeholderChoice(kind: DiscoveryFacetInput['kind'], id: number): DiscoveryChoice {
  return { id, name: `${kind[0].toUpperCase()}${kind.slice(1)} ${id}` };
}

/** A failed refresh is retried on the next search rather than cached as an empty catalogue. */
export function createDiscoveryFacetService(
  fetchTmdb: TmdbFetch,
  loadNetworks = loadNetworkCatalog,
) {
  let catalog: Promise<DiscoveryChoice[]> | undefined;
  let expires = 0;

  async function networks(): Promise<DiscoveryChoice[]> {
    if (!catalog || Date.now() >= expires) {
      expires = Date.now() + NETWORK_CATALOG_TTL_MS;
      catalog = loadNetworks().catch((error) => {
        catalog = undefined;
        throw error;
      });
    }
    return catalog;
  }

  /** Selected ids stay visible even when TMDB cannot describe them. */
  async function selectedChoice(
    kind: DiscoveryFacetInput['kind'],
    id: number,
  ): Promise<DiscoveryChoice> {
    try {
      const item = discoveryChoice.parse(await fetchTmdb(`/${kind}/${id}`));
      if (item.id !== id) {
        throw new Error('Upstream identifier mismatch');
      }
      return item;
    } catch {
      return placeholderChoice(kind, id);
    }
  }

  async function searchMatches(
    kind: DiscoveryFacetInput['kind'],
    query: string,
  ): Promise<DiscoveryChoice[]> {
    if (kind === 'network') {
      return searchNetworkCatalog(await networks(), query);
    }
    const response = await fetchTmdb(`/search/${kind}`, { searchParams: { query, page: 1 } });
    return choicesPageSchema.parse(response).results.slice(0, SEARCH_MATCH_LIMIT);
  }

  return async function facets({ kind, query, ids }: DiscoveryFacetInput) {
    const selectedIds = [...new Set(ids)];
    const selected = await Promise.all(selectedIds.map((id) => selectedChoice(kind, id)));
    if (query.length < 2) {
      return selected;
    }
    const matches = await searchMatches(kind, query);
    return [...selected, ...matches.filter((item) => !selectedIds.includes(item.id))];
  };
}
