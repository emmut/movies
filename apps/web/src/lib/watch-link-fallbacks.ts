import 'server-only';
import { getAppleCatalogueLinks } from '@/lib/apple-catalogue';
import {
  appendMarketFallbackLinks,
  homepageWatchLinks,
  needsAppleCatalogue,
  primaryWatchLinks,
  unresolvedWatchOffers,
  watchLinkFallbackRegions,
} from '@/lib/provider-link-sources';
import type {
  RegionWatchProviders,
  ResolvedWatchLink,
  WatchTitleContext,
} from '@/types/watch-provider';

/** Called only after all applicable local sources settle. Keep local > US > GB per offer. */
export async function getMarketFallbackWatchLinks(
  context: WatchTitleContext | undefined,
  region: string,
  providers: RegionWatchProviders | undefined,
  initialLinks: ResolvedWatchLink[],
) {
  let links = initialLinks;
  const wikidata = initialLinks.filter((link) => link.source === 'wikidata');
  for (const fallbackRegion of watchLinkFallbackRegions(region)) {
    if (!unresolvedWatchOffers(providers, links, region).length) break;
    const homepage = context ? homepageWatchLinks(context, fallbackRegion) : [];
    links = appendMarketFallbackLinks(
      links,
      primaryWatchLinks(wikidata, homepage),
      providers,
      region,
      fallbackRegion,
    );
    if (context && needsAppleCatalogue(providers, links, region)) {
      const apple = await getAppleCatalogueLinks(context, fallbackRegion);
      links = appendMarketFallbackLinks(
        links,
        apple.map((link) => ({ ...link, source: 'apple' as const })),
        providers,
        region,
        fallbackRegion,
      );
    }
  }
  return links;
}
