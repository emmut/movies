import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server';
import { DEFAULT_REGION } from './regions';

export const loadWatchProviderSearchParams = createLoader({
  with_watch_providers: parseAsArrayOf(parseAsInteger).withDefault([]),
  watch_region: parseAsString.withDefault(DEFAULT_REGION),
});

export function getWatchProvidersString(
  urlProviders: number[],
  userProviders: number[]
) {
  if (urlProviders.length > 0) {
    return urlProviders.join('|');
  }
  if (userProviders.length > 0) {
    return userProviders.join('|');
  }
  return undefined;
}
