import 'server-only';
import { getPopcornTimeWatchLinks } from '@/lib/popcorntime';
import { getWikidataWatchLinks } from '@/lib/wikidata';
import type { RegionWatchProviders, ResolvedWatchLink } from '@/types/watch-provider';

/** First matching provider/market/offer wins; Wikidata fills individual Popcorn Time gaps. */
export async function getProviderWatchLinks(
  type: 'movie' | 'tv',
  id: number,
  title: string,
  region: string,
  providers: RegionWatchProviders | undefined,
): Promise<ResolvedWatchLink[]> {
  const [primary, fallback] = await Promise.all([
    getPopcornTimeWatchLinks(type, id, title, region, providers),
    getWikidataWatchLinks(type, id),
  ]);
  return [
    ...primary.map((link) => ({ ...link, source: 'popcorntime' as const })),
    ...fallback.map((link) => ({ ...link, source: 'wikidata' as const })),
  ];
}
