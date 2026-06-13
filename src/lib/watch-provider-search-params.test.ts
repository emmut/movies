import { describe, expect, it } from 'vitest';

import { DEFAULT_REGION } from './regions';
import {
  getWatchProvidersString,
  loadWatchProviderSearchParams,
  parseAsPipeSeparatedArrayOfIntegers,
} from './watch-provider-search-params';

describe('loadWatchProviderSearchParams', () => {
  it('defaults to empty providers and the default region', () => {
    expect(loadWatchProviderSearchParams({})).toEqual({
      with_watch_providers: [],
      watch_region: DEFAULT_REGION,
    });
  });

  it('parses comma-separated providers and an explicit region', () => {
    expect(
      loadWatchProviderSearchParams({ with_watch_providers: '8,337', watch_region: 'US' }),
    ).toEqual({
      with_watch_providers: [8, 337],
      watch_region: 'US',
    });
  });
});

describe('getWatchProvidersString', () => {
  it('prefers url providers and pipe-joins them', () => {
    expect(getWatchProvidersString([8, 9], [1, 2])).toBe('8|9');
  });

  it('falls back to user providers when url providers are empty', () => {
    expect(getWatchProvidersString([], [1, 2])).toBe('1|2');
  });

  it('returns undefined when both lists are empty', () => {
    expect(getWatchProvidersString([], [])).toBeUndefined();
  });
});

describe('parseAsPipeSeparatedArrayOfIntegers', () => {
  it('returns an empty array for empty/undefined input', () => {
    expect(parseAsPipeSeparatedArrayOfIntegers.parse('')).toEqual([]);
  });

  // NOTE: despite the "pipe separated" name, the parser splits/joins on commas.
  // Tests pin the actual behaviour; rename or fix the impl if pipe was intended.
  it('splits on commas, not pipes', () => {
    expect(parseAsPipeSeparatedArrayOfIntegers.parse('8,9')).toEqual([8, 9]);
  });

  it('serializes back to a comma-separated string', () => {
    expect(parseAsPipeSeparatedArrayOfIntegers.serialize([8, 9])).toBe('8,9');
  });
});
