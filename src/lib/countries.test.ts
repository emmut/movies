import { describe, expect, it } from 'vitest';

import {
  curatedOriginCountries,
  getCountryFlag,
  getCountryName,
  getOriginCountryString,
  getVisibleOriginCountries,
  originCountries,
  sanitizeOriginCountryCodes,
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

  it('does not throw on syntactically invalid codes', () => {
    expect(getCountryName('foo')).toBe('foo');
  });
});

describe('getCountryFlag', () => {
  it('maps a code to its regional-indicator emoji', () => {
    expect(getCountryFlag('SE')).toBe('🇸🇪');
    expect(getCountryFlag('us')).toBe('🇺🇸');
  });
});

describe('sanitizeOriginCountryCodes', () => {
  it('uppercases, dedupes, and drops unknown codes', () => {
    expect(sanitizeOriginCountryCodes(['se', 'SE', ' kr ', 'foo', 'XX'])).toEqual(['SE', 'KR']);
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

  it('sanitizes URL-sourced codes before joining', () => {
    expect(getOriginCountryString(['se', 'foo', 'KR'])).toBe('SE|KR');
    expect(getOriginCountryString(['foo'])).toBeUndefined();
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

  it('searches by exact country code', () => {
    expect(getVisibleOriginCountries('nz', [])[0]).toBe('NZ');
  });

  it('ranks name-prefix matches before substring matches, alphabetically', () => {
    expect(getVisibleOriginCountries('sw', [])).toEqual(['SE', 'CH', 'BW', 'SZ']);
  });

  it('prepends selected codes missing from the current list', () => {
    expect(getVisibleOriginCountries('zimb', ['SE'])).toEqual(['SE', 'ZW']);
    expect(getVisibleOriginCountries('', ['ZW'])).toEqual(['ZW', ...curatedOriginCountries]);
  });

  it('drops invalid selected codes instead of pinning them', () => {
    expect(getVisibleOriginCountries('', ['foo'])).toEqual(curatedOriginCountries);
  });

  it('does not duplicate selected codes already in the list', () => {
    expect(getVisibleOriginCountries('', ['SE'])).toEqual(curatedOriginCountries);
  });
});
