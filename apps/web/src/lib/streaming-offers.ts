import type {
  PopcornTimeAvailability,
  RegionWatchProviders,
  ResolvedWatchLink,
  StreamingOffer,
  WatchOfferType,
} from '@/types/watch-provider';

import { getDirectWatchLink } from './watch-links';

const tmdbOfferTypes: WatchOfferType[] = ['free', 'ads', 'flatrate', 'rent', 'buy'];

function offerIdentity(offer: StreamingOffer) {
  const name = offer.providerName
    .normalize('NFKC')
    .toLowerCase()
    .replaceAll('+', 'plus')
    .replace(/[^\p{L}\p{N}]/gu, '');
  // Never collapse a channel bundle into its standalone service.
  return `${offer.type}:${name}:${offer.via ?? ''}`;
}

function getTmdbOffers(
  providers: RegionWatchProviders | undefined,
  links: ResolvedWatchLink[],
  region: string,
  watchUrl: string,
): StreamingOffer[] {
  return tmdbOfferTypes.flatMap((type) =>
    (providers?.[type] ?? []).map((provider) => {
      const link = getDirectWatchLink(links, provider.provider_id, region, type);
      return {
        providerId: `tmdb:${provider.provider_id}`,
        providerName: provider.provider_name,
        via: null,
        logo: provider.logo_path || null,
        type,
        url: link?.url ?? watchUrl,
        source: link?.source ?? 'tmdb',
        availabilitySource: 'tmdb' as const,
      };
    }),
  );
}

/** Popcorn Time supplies all its offers; TMDB/Wikidata fill gaps without restricting coverage. */
export function getStreamingOffers(
  popcornTime: PopcornTimeAvailability | null | undefined,
  providers: RegionWatchProviders | undefined,
  links: ResolvedWatchLink[],
  region: string,
  watchUrl: string,
): StreamingOffer[] {
  const primary = popcornTime?.region === region ? popcornTime.offers : [];
  const covered = new Set(primary.map(offerIdentity));
  return [
    ...primary,
    ...getTmdbOffers(providers, links, region, watchUrl).filter(
      (offer) => !covered.has(offerIdentity(offer)),
    ),
  ];
}
