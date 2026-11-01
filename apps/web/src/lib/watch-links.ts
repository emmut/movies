import type { DirectWatchLink, WatchOfferType } from '@/types/watch-provider';

/** Call only for a provider present in TMDB's selected-region availability. */
export function getDirectWatchUrl(
  links: DirectWatchLink[],
  providerId: number,
  region: string,
  type: WatchOfferType,
) {
  return links.find(
    (link) =>
      link.providerId === providerId &&
      (!link.regions || link.regions.includes(region)) &&
      link.types.includes(type),
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
