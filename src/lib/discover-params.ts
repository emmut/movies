import { MAJOR_STREAMING_PROVIDERS } from './config';
import { MIN_RUNTIME_FILTER_MINUTES } from './constants';
import { DEFAULT_REGION } from './regions';

const majorProviders = MAJOR_STREAMING_PROVIDERS.join('|');

type DiscoverParams = {
  genreId: number;
  page: number;
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
  withRuntimeLte?: number;
};

/**
 * Builds the TMDb `/discover` query parameters shared by the movie and TV show
 * discover endpoints. Applies the genre, watch-provider, and runtime filters,
 * falling back to the major streaming providers and default region when no
 * explicit watch-provider filter is given.
 */
export function buildDiscoverSearchParams({
  genreId,
  page,
  sortBy,
  watchProviders,
  watchRegion,
  withRuntimeLte,
}: DiscoverParams): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {
    page,
    sort_by: sortBy ?? 'popularity.desc',
    region: DEFAULT_REGION,
    include_adult: 'false',
  };

  if (genreId !== 0) params.with_genres = genreId;

  if (watchProviders && watchRegion) {
    params.with_watch_providers = watchProviders;
    params.watch_region = watchRegion;
  } else {
    params.with_watch_providers = majorProviders;
    params.watch_region = watchRegion ?? DEFAULT_REGION;
  }

  if (typeof withRuntimeLte === 'number' && withRuntimeLte > 0) {
    params['with_runtime.lte'] = withRuntimeLte;
    params['with_runtime.gte'] = MIN_RUNTIME_FILTER_MINUTES;
  }

  return params;
}
