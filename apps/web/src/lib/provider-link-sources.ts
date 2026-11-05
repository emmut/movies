import { getDirectWatchUrl } from '@/lib/watch-links';
import { reviewedProviderUrlLinks } from '@/lib/wikidata-url-links';
import type {
  DirectWatchLink,
  RegionWatchProviders,
  ResolvedWatchLink,
  WatchTitleContext,
} from '@/types/watch-provider';

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
