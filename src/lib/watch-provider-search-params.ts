import {
  createLoader,
  createParser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server';

// `watch_region` has no default on purpose: callers fall back to the user's
// stored region when the URL does not pin one.
export const loadWatchProviderSearchParams = createLoader({
  with_watch_providers: parseAsArrayOf(parseAsInteger).withDefault([]),
  watch_region: parseAsString,
});

/**
 * Normalizes the active stream-provider filter from parsed search params:
 * both members are `undefined` while no providers are selected, so query keys
 * and server calls stay identical between server shells and client content.
 */
export function activeWatchProviderFilter(withWatchProviders: number[], region: string) {
  if (withWatchProviders.length === 0) {
    return { activeProviders: undefined, activeRegion: undefined };
  }

  return { activeProviders: withWatchProviders, activeRegion: region };
}

export function getWatchProvidersString(urlProviders: number[], userProviders: number[]) {
  if (urlProviders.length > 0) {
    return urlProviders.join('|');
  }
  if (userProviders.length > 0) {
    return userProviders.join('|');
  }
  return undefined;
}

export const parseAsPipeSeparatedArrayOfIntegers = createParser({
  parse(value) {
    if (!value) {
      return [];
    }
    return value.split(',').map(Number);
  },
  serialize(value) {
    return value.join(',');
  },
});
