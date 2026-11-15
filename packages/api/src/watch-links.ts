import type { DirectWatchLink, WatchOfferType } from '@movies/api/tmdb-types/watch-provider';

/** Call only for a provider present in TMDB's selected-region availability. */
export function getDirectWatchUrl(
  links: DirectWatchLink[],
  providerId: number,
  region: string,
  type: WatchOfferType,
) {
  function matches(link: DirectWatchLink) {
    const inRegion = !link.regions || link.regions.includes(region);
    return link.providerId === providerId && inRegion && link.types.includes(type);
  }
  return links.find(matches)?.url;
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
