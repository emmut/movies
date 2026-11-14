import 'server-only';
import { createServerApi } from '@/lib/api-server';

/** Optional title links use the same validated service and fallback as native. */
export async function getWikidataWatchLinks(type: 'movie' | 'tv', id: number) {
  try {
    return await createServerApi(new Headers()).catalog.watchLinks({ type, id });
  } catch {
    console.warn('Wikidata title links unavailable; using TMDB watch options.');
    return [];
  }
}
