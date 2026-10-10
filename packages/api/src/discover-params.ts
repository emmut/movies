import { MAJOR_STREAMING_PROVIDERS } from '@movies/config/constants';
import { DEFAULT_REGION } from '@movies/config/regions';

export const MIN_RUNTIME_FILTER_MINUTES = 1;
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
type TmdbParams = Record<string, string | number | undefined>;

function applySelections(params: TmdbParams, input: DiscoverParams) {
  // Pipe = OR on TMDB: each extra genre widens the results.
  if (input.genreIds.length > 0) params.with_genres = input.genreIds.join('|');
  if (input.withOriginCountry) params.with_origin_country = input.withOriginCountry;
}

function applyProviders(params: TmdbParams, input: DiscoverParams) {
  if (input.watchProviders && input.watchRegion) {
    params.with_watch_providers = input.watchProviders;
    params.watch_region = input.watchRegion;
    return;
  }
  // Country-only discovery must not be narrowed to the default streamers.
  if (input.withOriginCountry) return;
  params.with_watch_providers = majorProviders;
  params.watch_region = params.region;
}

function applyRuntime(params: TmdbParams, runtime: number | undefined) {
  if (typeof runtime !== 'number') return;
  if (!(runtime > 0)) return;
  params['with_runtime.lte'] = runtime;
  params['with_runtime.gte'] = MIN_RUNTIME_FILTER_MINUTES;
}

/** Canonical movie/TV discovery parameters, preserving web defaults and OR filters. */
export function buildDiscoverSearchParams(input: DiscoverParams): TmdbParams {
  const params: TmdbParams = {
    page: input.page,
    sort_by: input.sortBy || 'popularity.desc',
    region: input.watchRegion ?? DEFAULT_REGION,
    include_adult: 'false',
  };
  applySelections(params, input);
  applyProviders(params, input);
  applyRuntime(params, input.withRuntimeLte);
  return params;
}
