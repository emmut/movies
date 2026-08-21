import { describe, expect, it } from 'vitest';

import {
  curatedOriginCountries,
  getCountryName,
  getOriginCountryString,
  getVisibleOriginCountries,
  originCountries,
} from './countries';

describe('originCountries', () => {
  it('contains unique, well-formed ISO 3166-1 alpha-2 codes', () => {
    expect(new Set(originCountries).size).toBe(originCountries.length);
    for (const code of originCountries) {
      expect(code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('includes every curated country', () => {
    for (const code of curatedOriginCountries) {
      expect(originCountries).toContain(code);
    }
  });
});

describe('getCountryName', () => {
  it('resolves an English display name', () => {
    expect(getCountryName('SE')).toBe('Sweden');
    expect(getCountryName('KR')).toBe('South Korea');
  });

  it('falls back to the code for unknown regions', () => {
    expect(getCountryName('XX')).toBe('XX');
  });
});

describe('getOriginCountryString', () => {
  it('returns undefined for an empty selection', () => {
    expect(getOriginCountryString([])).toBeUndefined();
  });

  it('joins codes with pipes for TMDb OR semantics', () => {
    expect(getOriginCountryString(['SE'])).toBe('SE');
    expect(getOriginCountryString(['SE', 'KR'])).toBe('SE|KR');
  });
});

describe('getVisibleOriginCountries', () => {
  it('shows the curated list when the query is empty', () => {
    expect(getVisibleOriginCountries('', [])).toEqual(curatedOriginCountries);
  });

  it('searches the full list by name, case-insensitively', () => {
    expect(getVisibleOriginCountries('swe', [])).toContain('SE');
    expect(getVisibleOriginCountries('zimb', [])).toEqual(['ZW']);
  });

  it('searches by country code', () => {
    expect(getVisibleOriginCountries('nz', [])).toContain('NZ');
  });

  it('prepends selected codes missing from the current list', () => {
    expect(getVisibleOriginCountries('zimb', ['SE'])).toEqual(['SE', 'ZW']);
    expect(getVisibleOriginCountries('', ['ZW'])).toEqual(['ZW', ...curatedOriginCountries]);
  });

  it('does not duplicate selected codes already in the list', () => {
    expect(getVisibleOriginCountries('', ['SE'])).toEqual(curatedOriginCountries);
  });
});
