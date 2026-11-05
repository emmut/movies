import { getDirectWatchUrl } from '@/lib/watch-links';
import { reviewedProviderUrlLinks } from '@/lib/wikidata-url-links';
import type {
  DirectWatchLink,
  RegionWatchProviders,
  ResolvedWatchLink,
  WatchOfferType,
  WatchTitleContext,
} from '@/types/watch-provider';

export function watchLinkFallbackRegions(region: string) {
  return (['US', 'GB'] as const).filter((candidate) => candidate !== region);
}

export function unresolvedWatchOffers(
  providers: RegionWatchProviders | undefined,
  links: DirectWatchLink[],
  region: string,
) {
  const types: WatchOfferType[] = ['free', 'ads', 'flatrate', 'rent', 'buy'];
  return types.flatMap((type) =>
    (providers?.[type] ?? []).flatMap((provider) =>
      getDirectWatchUrl(links, provider.provider_id, region, type)
        ? []
        : [{ providerId: provider.provider_id, type }],
    ),
  );
}

/** Foreign destinations fill only unresolved local offers; availability is never imported. */
export function appendMarketFallbackLinks(
  links: ResolvedWatchLink[],
  candidates: ResolvedWatchLink[],
  providers: RegionWatchProviders | undefined,
  region: string,
  fallbackRegion: 'US' | 'GB',
): ResolvedWatchLink[] {
  return [
    ...links,
    ...unresolvedWatchOffers(providers, links, region).flatMap(({ providerId, type }) => {
      const candidate = candidates.find(
        (link) =>
          link.providerId === providerId &&
          link.types.includes(type) &&
          (!link.regions || link.regions.includes(fallbackRegion)),
      );
      return candidate ? [{ ...candidate, regions: [region], types: [type], fallbackRegion }] : [];
    }),
  ];
}

export function homepageWatchLinks(
  context: WatchTitleContext,
  region: string,
): ResolvedWatchLink[] {
  return context.homepage
    ? reviewedProviderUrlLinks(context.homepage, context.type, region).map((link) => ({
        ...link,
        source: 'tmdb-homepage' as const,
      }))
    : [];
}

export function primaryWatchLinks(
  wikidata: DirectWatchLink[],
  homepage: ResolvedWatchLink[],
): ResolvedWatchLink[] {
  return [...wikidata.map((link) => ({ ...link, source: 'wikidata' as const })), ...homepage];
}

export function needsAppleCatalogue(
  providers: RegionWatchProviders | undefined,
  links: DirectWatchLink[],
  region: string,
) {
  return (['rent', 'buy'] as const).some((type) =>
    providers?.[type]?.some(
      (provider) => provider.provider_id === 2 && !getDirectWatchUrl(links, 2, region, type),
    ),
  );
}
