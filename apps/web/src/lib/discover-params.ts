import { MAJOR_STREAMING_PROVIDERS } from './config';
import { MIN_RUNTIME_FILTER_MINUTES } from './constants';
import { DEFAULT_REGION } from './regions';

const majorProviders = MAJOR_STREAMING_PROVIDERS.join('|');

type DiscoverParams = {
  genreIds: number[];
  page: number;
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
  withRuntimeLte?: number;
  withOriginCountry?: string;
};

/**
 * Builds the TMDb `/discover` query parameters shared by the movie and TV show
 * discover endpoints. Applies the genre, watch-provider, and runtime filters,
 * falling back to the major streaming providers and default region when no
 * explicit watch-provider filter is given — unless an origin-country filter
 * is active, in which case results stay unrestricted by provider.
 */
export function buildDiscoverSearchParams({
  genreIds,
  page,
  sortBy,
  watchProviders,
  watchRegion,
  withRuntimeLte,
  withOriginCountry,
}: DiscoverParams): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {
    page,
    sort_by: sortBy || 'popularity.desc',
    // Follows the caller's region, same fallback as `watch_region` below. Pinning
    // this to DEFAULT_REGION made discover ignore the signed-in user's region, so
    // logging in changed nothing about which region TMDb resolved results for.
    region: watchRegion ?? DEFAULT_REGION,
    include_adult: 'false',
  };

  // Pipe = OR on TMDb: each extra genre widens the results.
  if (genreIds.length > 0) {
    params.with_genres = genreIds.join('|');
  }

  if (withOriginCountry) {
    params.with_origin_country = withOriginCountry;
  }

  if (watchProviders && watchRegion) {
    params.with_watch_providers = watchProviders;
    params.watch_region = watchRegion;
  } else if (!withOriginCountry) {
    // Origin-country filtering skips the major-provider fallback: most of a
    // country's catalog isn't on the big streamers in the default region, so
    // keeping the fallback would hollow out the results.
    params.with_watch_providers = majorProviders;
    params.watch_region = watchRegion ?? DEFAULT_REGION;
  }

  if (typeof withRuntimeLte === 'number' && withRuntimeLte > 0) {
    params['with_runtime.lte'] = withRuntimeLte;
    params['with_runtime.gte'] = MIN_RUNTIME_FILTER_MINUTES;
  }

  return params;
}
