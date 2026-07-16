import { StreamingProviders } from '@/components/streaming-providers';
import { Skeleton } from '@/components/ui/skeleton';
import { getMovieWatchProviders } from '@/lib/movies';
import type { RegionCode } from '@/lib/regions';
import { optional } from '@/lib/tmdb';
import { getTvShowWatchProviders } from '@/lib/tv-shows';

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
  const watchProviders = await optional(providers, { results: {} });

  return (
    <StreamingProviders
      watchProviders={watchProviders}
      resourceId={resourceId}
      resourceType={resourceType}
      userRegion={userRegion}
    />
  );
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
