import { discoveryInput, type DiscoveryInput } from '@movies/api/discover';
import { MOVIE_SORT_OPTIONS, TV_SORT_OPTIONS } from '@movies/api/discover-options';
import { resolveWatchProviderIds } from '@movies/api/preferences';
import { sanitizeOriginCountryCodes } from '@movies/config/countries';
import {
  providerIdList,
  regionOr,
  scalar,
  type SearchParams as Params,
} from '@native/lib/search-params';

function ids(value: Params[string], maxSelections = 50) {
  return (scalar(value) ?? '')
    .split(/[|,]/)
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .slice(0, maxSelections);
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
  return discoveryInput.parse({
    type,
    region: regionOr(params.watch_region, region),
    sortBy: sortForType(type, params.sort_by),
    page: boundedInteger(params.page, 500) ?? 1,
    runtime: boundedInteger(params.runtime, 600),
    genreIds: ids(params.genreId),
    providerIds: resolveWatchProviderIds(
      providerIdList(params.with_watch_providers),
      userProviders,
    ),
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
