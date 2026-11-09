import type { inferParserType } from 'nuqs/server';

import { getOriginCountryString } from './countries';
import { getDiscoverWatchProviders } from './discover-params';
import { discoverSearchParsers, discoverSearchUrlKeys } from './discover-search-params';
import { parseAsPipeSeparatedArrayOfIntegers } from './watch-provider-search-params';

const { runtime, ...sharedParsers } = discoverSearchParsers;

export const discoverViewParsers = {
  ...sharedParsers,
  with_watch_providers: parseAsPipeSeparatedArrayOfIntegers.withDefault([]),
  runtimeLte: runtime,
};

export const discoverViewUrlKeys = {
  ...discoverSearchUrlKeys,
  runtimeLte: 'runtime',
} as const;

type DiscoverUrlState = inferParserType<typeof discoverViewParsers>;
type DiscoverDefaults = { region: string; watchProviders: number[] };

type ActiveFilterState = {
  sortBy: string;
  runtimeLte: number | null;
  originCountries: string[];
  watchProviders: number[] | null;
};

export function getAdditionalFilterCount({
  runtimeLte,
  originCountries,
  watchProviders,
}: Omit<ActiveFilterState, 'sortBy'>) {
  return (
    Number((runtimeLte ?? 0) > 0) +
    Number(originCountries.length > 0) +
    Number((watchProviders?.length ?? 0) > 0)
  );
}

export function getActiveFilterCount(state: ActiveFilterState) {
  return Number(state.sortBy !== 'popularity.desc') + getAdditionalFilterCount(state);
}

function resolveDiscoverQuery(urlState: DiscoverUrlState, defaults: DiscoverDefaults) {
  const networkIds = urlState.mediaType === 'tv' ? urlState.networkIds : [];

  return {
    page: urlState.page,
    genreIds: urlState.genreIds,
    keywordIds: urlState.keywordIds,
    companyIds: urlState.companyIds,
    networkIds,
    mediaType: urlState.mediaType,
    sortBy: urlState.sort_by,
    // Match server provider selection to preserve the hydrated query cache.
    watchProviders: getDiscoverWatchProviders(
      urlState.with_watch_providers,
      defaults.watchProviders,
      urlState.keywordIds,
      urlState.companyIds,
      networkIds,
    ),
    watchRegion: urlState.watch_region ?? defaults.region,
    runtimeLte: urlState.runtimeLte ?? undefined,
    originCountry: getOriginCountryString(urlState.with_origin_country),
  };
}

/** Resolve URL filters and user defaults independently of React and URL mutations. */
export function resolveDiscoverViewState(urlState: DiscoverUrlState, defaults: DiscoverDefaults) {
  const query = resolveDiscoverQuery(urlState, defaults);
  const activeFilterCount =
    query.keywordIds.length +
    query.companyIds.length +
    query.networkIds.length +
    getActiveFilterCount({
      sortBy: query.sortBy,
      runtimeLte: urlState.runtimeLte,
      originCountries: urlState.with_origin_country,
      watchProviders: urlState.with_watch_providers,
    });

  return { ...query, activeFilterCount };
}
