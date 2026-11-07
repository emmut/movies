import 'server-only';
import { getPopcorntimeWatchLinks } from '@/lib/popcorntime';
import { getWikidataWatchLinks } from '@/lib/wikidata';

/** Prefer country/offer-specific destinations; retain Wikidata for remaining gaps. */
export async function getDirectWatchLinks(type: 'movie' | 'tv', id: number) {
  const [popcorntime, wikidata] = await Promise.all([
    getPopcorntimeWatchLinks(type, id),
    getWikidataWatchLinks(type, id),
  ]);
  return [...popcorntime, ...wikidata];
}
