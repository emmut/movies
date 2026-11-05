import { getRegionByCode, type RegionCode } from '@movies/config/regions';
import { Skeleton } from '@movies/ui/components/skeleton';
import { Suspense, type ComponentProps } from 'react';

import { StreamingProviders } from '@/components/streaming-providers';
import { getAppleCatalogueLinks } from '@/lib/apple-catalogue';
import { getMovieWatchProviders } from '@/lib/movies';
import {
  homepageWatchLinks,
  primaryWatchLinks,
  needsAppleCatalogue,
} from '@/lib/provider-link-sources';
import { optional } from '@/lib/tmdb';
import { getTvShowWatchProviders } from '@/lib/tv-shows';
import { getWikidataWatchLinks } from '@/lib/wikidata';
import type { DirectWatchLink, ResolvedWatchLink, WatchTitleContext } from '@/types/watch-provider';

type StreamingSectionProps = {
  resourceId: number;
  resourceType: 'movie' | 'tv';
  userRegion: RegionCode;
  searchParams: Promise<{ region?: string | string[] }>;
  titleContext: WatchTitleContext | undefined;
};

/**
 * "Where to watch" providers, fetched independently so a slow or failed
 * `/watch/providers` response streams in (or degrades to an empty region)
 * without blocking the rest of the page.
 */
export async function StreamingSection({
  resourceId,
  resourceType,
  userRegion,
  searchParams,
  titleContext,
}: StreamingSectionProps) {
  const providers =
    resourceType === 'movie'
      ? getMovieWatchProviders(resourceId)
      : getTvShowWatchProviders(resourceId);
  const [watchProviders, params] = await Promise.all([
    optional(providers, { results: {} }),
    searchParams,
  ]);
  const region =
    (typeof params.region === 'string' && getRegionByCode(params.region)?.code) || userRegion;
  const directLinks = getWikidataWatchLinks(resourceType, resourceId, region);
  const props = { watchProviders, resourceId, resourceType, userRegion };
  const homepage = titleContext ? homepageWatchLinks(titleContext, region) : [];

  return (
    <Suspense key={region} fallback={<StreamingProviders {...props} directLinks={homepage} />}>
      <ProvidersWithDirectLinks
        {...props}
        directLinks={directLinks}
        homepage={homepage}
        titleContext={titleContext}
        region={region}
      />
    </Suspense>
  );
}

/** Enhance the already visible availability when the optional lookup finishes. */
async function ProvidersWithDirectLinks({
  directLinks,
  homepage,
  titleContext,
  region,
  ...props
}: Omit<ComponentProps<typeof StreamingProviders>, 'directLinks'> & {
  directLinks: Promise<DirectWatchLink[]>;
  homepage: ResolvedWatchLink[];
  titleContext: WatchTitleContext | undefined;
  region: RegionCode;
}) {
  const links = primaryWatchLinks(await directLinks, homepage);
  if (!titleContext || !needsAppleCatalogue(props.watchProviders.results[region], links, region)) {
    return <StreamingProviders {...props} directLinks={links} />;
  }
  const apple = getAppleCatalogueLinks(titleContext, region);
  return (
    <Suspense fallback={<StreamingProviders {...props} directLinks={links} />}>
      <ProvidersWithAppleLinks {...props} links={links} apple={apple} />
    </Suspense>
  );
}

async function ProvidersWithAppleLinks({
  links,
  apple,
  ...props
}: Omit<ComponentProps<typeof StreamingProviders>, 'directLinks'> & {
  links: ResolvedWatchLink[];
  apple: Promise<DirectWatchLink[]>;
}) {
  const directLinks = [
    ...links,
    ...(await apple).map((link) => ({ ...link, source: 'apple' as const })),
  ];
  return <StreamingProviders {...props} directLinks={directLinks} />;
}

/** Placeholder shown while {@link StreamingSection} streams in. */
export function StreamingSectionSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-48" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
