import type { DirectWatchOffer, WatchOfferType } from '@/types/watch-provider';

function providerKey(name: string) {
  const key = name.trim().toLowerCase();
  // Only equivalent service names. Channel bundles and ad tiers stay distinct.
  if (key === 'amazon prime' || key === 'prime video') {
    return 'amazon prime video';
  }
  return key;
}

export function getDirectWatchUrl(
  offers: DirectWatchOffer[],
  providerName: string,
  region: string,
  type: WatchOfferType,
) {
  return offers.find(
    (offer) =>
      offer.region === region &&
      offer.type === type &&
      providerKey(offer.providerName) === providerKey(providerName),
  )?.url;
}

export function getTmdbWatchUrl(type: 'movie' | 'tv', id: number, region: string, link?: string) {
  if (link) {
    try {
      const url = new URL(link);
      if (url.origin === 'https://www.themoviedb.org' && !url.username && !url.password) {
        return url.href;
      }
    } catch {
      // Missing or malformed regional links use the title's watch page.
    }
  }
  return `https://www.themoviedb.org/${type}/${id}/watch?locale=${region}`;
}
