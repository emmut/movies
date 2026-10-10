import { discoveryInput, type DiscoveryInput } from '@movies/api/discover';
import { MOVIE_SORT_OPTIONS, TV_SORT_OPTIONS } from '@movies/api/discover-options';
import { regionSchema } from '@movies/config/regions';

type Params = Record<string, string | string[] | undefined>;

function scalar(value: Params[string]) {
  return Array.isArray(value) ? value[0] : value;
}
function ids(value: Params[string]) {
  return (scalar(value) ?? '')
    .split(/[|,]/)
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .slice(0, 50);
}
function boundedInteger(value: Params[string], max: number) {
  const number = Number(scalar(value));
  if (!Number.isInteger(number)) return undefined;
  if (number < 1 || number > max) return undefined;
  return number;
}
function watchRegion(value: Params[string], fallback: string) {
  const parsed = regionSchema.safeParse(scalar(value));
  return parsed.success ? parsed.data : fallback;
}
function sortForType(type: 'movie' | 'tv', value: Params[string]) {
  const options = type === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS;
  return options.find((option) => option.value === scalar(value))?.value ?? 'popularity.desc';
}
function countryCodes(value: Params[string]) {
  return (scalar(value) ?? '')
    .split(/[|,]/)
    .filter((code) => /^[A-Z]{2}$/.test(code))
    .slice(0, 50);
}
export function readDiscoverState(params: Params, region: string): DiscoveryInput {
  const type = scalar(params.mediaType) === 'tv' ? 'tv' : 'movie';
  return discoveryInput.parse({
    type,
    region: watchRegion(params.watch_region, region),
    sortBy: sortForType(type, params.sort_by),
    page: boundedInteger(params.page, 500) ?? 1,
    runtime: boundedInteger(params.runtime, 600),
    genreIds: ids(params.genreId),
    providerIds: ids(params.with_watch_providers),
    originCountries: countryCodes(params.with_origin_country),
  });
}
export function toggleSelection(values: string[], value: string) {
  if (values.includes(value)) return values.filter((entry) => entry !== value);
  return [...values, value];
}
