import type { RegionCode } from '@movies/config/regions';
import { Skeleton } from '@movies/ui/components/skeleton';
import { Suspense, type ComponentProps } from 'react';

import { StreamingProviders } from '@/components/streaming-providers';
import { getMovieWatchProviders } from '@/lib/movies';
import { optional } from '@/lib/tmdb';
import { getTvShowWatchProviders } from '@/lib/tv-shows';
import { getWikidataWatchLinks } from '@/lib/wikidata';
import type { DirectWatchLink } from '@/types/watch-provider';

type StreamingSectionProps = {
  resourceId: number;
  resourceType: 'movie' | 'tv';
  userRegion: RegionCode;
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
}: StreamingSectionProps) {
  const providers =
    resourceType === 'movie'
      ? getMovieWatchProviders(resourceId)
      : getTvShowWatchProviders(resourceId);
  const directLinks = getWikidataWatchLinks(resourceType, resourceId);
  const watchProviders = await optional(providers, { results: {} });
  const props = { watchProviders, resourceId, resourceType, userRegion };

  return (
    <Suspense fallback={<StreamingProviders {...props} directLinks={undefined} />}>
      <ProvidersWithDirectLinks {...props} directLinks={directLinks} />
    </Suspense>
  );
}

/** Enhance the already visible availability when the optional lookup finishes. */
async function ProvidersWithDirectLinks({
  directLinks,
  ...props
}: Omit<ComponentProps<typeof StreamingProviders>, 'directLinks'> & {
  directLinks: Promise<DirectWatchLink[]>;
}) {
  return <StreamingProviders {...props} directLinks={await directLinks} />;
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
