import { watchProviderIdSchema } from '@movies/api/preferences';
import { regionSchema } from '@movies/config/regions';

export type SearchParams = Record<string, string | string[] | undefined>;
export type SearchParamValue = SearchParams[string];

/** Expo Router repeats a key as an array; the first occurrence wins. */
export function scalar(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/** Provider ids from a `|`- or `,`-separated URL value, keeping only storable ids. */
export function providerIdList(value: SearchParamValue) {
  return (scalar(value) ?? '')
    .split(/[|,]/)
    .map(Number)
    .filter((id) => watchProviderIdSchema.safeParse(id).success);
}

/** A valid region from the URL, or the caller's fallback. */
export function regionOr(value: SearchParamValue, fallback: string) {
  const parsed = regionSchema.safeParse(scalar(value));
  if (parsed.success) {
    return parsed.data;
  }
  return fallback;
}
