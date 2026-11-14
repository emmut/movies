import { discoveryInput, type DiscoveryInput } from '@movies/api/discover';
import { MOVIE_SORT_OPTIONS, TV_SORT_OPTIONS } from '@movies/api/discover-options';
import { getDiscoverWatchProviders } from '@movies/api/discover-params';
import { sanitizeOriginCountryCodes } from '@movies/config/countries';
import {
  providerIdList,
  regionOr,
  scalar,
  type SearchParams as Params,
} from '@native/lib/search-params';

function ids(value: Params[string], maxSelections = 50) {
  return [
    ...new Set(
      (scalar(value) ?? '')
        .split(/[|,]/)
        .map(Number)
        .filter((id) => Number.isSafeInteger(id) && id > 0),
    ),
  ].slice(0, maxSelections);
}
function boundedInteger(value: Params[string], max: number) {
  const number = Number(scalar(value));
  if (!Number.isInteger(number)) {
    return undefined;
  }
  if (number < 1 || number > max) {
    return undefined;
  }
  return number;
}
function sortForType(type: 'movie' | 'tv', value: Params[string]) {
  const options = type === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS;
  return options.find((option) => option.value === scalar(value))?.value ?? 'popularity.desc';
}
function countryCodes(value: Params[string]) {
  return sanitizeOriginCountryCodes((scalar(value) ?? '').split(/[|,]/)).slice(0, 50);
}
export function readDiscoverState(
  params: Params,
  region: string,
  userProviders: number[] = [],
): DiscoveryInput {
  const type = scalar(params.mediaType) === 'tv' ? 'tv' : 'movie';
  const keywordIds = ids(params.keywordId);
  const companyIds = ids(params.companyId);
  const networkIds = type === 'tv' ? ids(params.networkId) : [];
  const providers = getDiscoverWatchProviders(
    providerIdList(params.with_watch_providers),
    userProviders,
    keywordIds,
    companyIds,
    networkIds,
  );
  return discoveryInput.parse({
    keywordIds,
    companyIds,
    networkIds,
    type,
    region: regionOr(params.watch_region, region),
    sortBy: sortForType(type, params.sort_by),
    page: boundedInteger(params.page, 500) ?? 1,
    runtime: boundedInteger(params.runtime, 600),
    genreIds: ids(params.genreId),
    providerIds: providers ? providers.split('|').map(Number) : [],
    originCountries: countryCodes(params.with_origin_country),
  });
}
export function toggleSelection(values: string[], value: string, maxSelections?: number) {
  if (values.includes(value)) {
    return values.filter((entry) => entry !== value);
  }
  if (maxSelections !== undefined && values.length >= maxSelections) {
    return values;
  }
  return [...values, value];
}
