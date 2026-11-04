import 'server-only';
import { getPopcornTimeAvailability } from '@/lib/popcorntime';
import { getWikidataWatchLinks } from '@/lib/wikidata';
import type { ProviderWatchOptions } from '@/types/watch-provider';

/** Load independent Popcorn Time offers and Wikidata links for TMDB fallback offers. */
export async function getProviderWatchOptions(
  type: 'movie' | 'tv',
  id: number,
  title: string,
  region: string,
): Promise<ProviderWatchOptions> {
  const [popcornTime, fallback] = await Promise.all([
    getPopcornTimeAvailability(type, id, title, region),
    getWikidataWatchLinks(type, id),
  ]);
  return {
    popcornTime,
    directLinks: fallback.map((link) => ({ ...link, source: 'wikidata' as const })),
  };
}
