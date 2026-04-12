import { createParser } from 'nuqs';

import { DEFAULT_REGION } from './regions';

export { DEFAULT_REGION };

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
