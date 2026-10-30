import { describe, expect, it } from 'vite-plus/test';

import {
  getActiveFilterCount,
  getAdditionalFilterCount,
  getFilterButtonLabel,
} from './filters-panel';

describe('getActiveFilterCount', () => {
  it('does not count default or ineffective values', () => {
    expect(
      getActiveFilterCount({
        sortBy: 'popularity.desc',
        runtimeLte: 0,
        originCountries: [],
        watchProviders: null,
      }),
    ).toBe(0);
  });

  it('counts each active filter category once', () => {
    expect(
      getActiveFilterCount({
        sortBy: 'vote_average.desc',
        runtimeLte: 90,
        originCountries: ['SE', 'NO'],
        watchProviders: [8, 337, 384],
      }),
    ).toBe(4);
  });
});

describe('getFilterButtonLabel', () => {
  it('uses a concise default label when no filters are active', () => {
    expect(getFilterButtonLabel(0)).toBe('Filters');
  });

  it('includes the number of active filter categories', () => {
    expect(getFilterButtonLabel(1)).toBe('Filters (1)');
    expect(getFilterButtonLabel(4)).toBe('Filters (4)');
  });
});

describe('getAdditionalFilterCount', () => {
  it('does not count default or ineffective additional filters', () => {
    expect(
      getAdditionalFilterCount({ runtimeLte: 0, originCountries: [], watchProviders: null }),
    ).toBe(0);
    expect(
      getAdditionalFilterCount({ runtimeLte: null, originCountries: [], watchProviders: [] }),
    ).toBe(0);
  });
  it('counts runtime, countries and providers once per category', () => {
    expect(
      getAdditionalFilterCount({
        runtimeLte: 90,
        originCountries: ['SE', 'NO'],
        watchProviders: [8, 337],
      }),
    ).toBe(3);
    expect(
      getAdditionalFilterCount({ runtimeLte: null, originCountries: ['SE'], watchProviders: [] }),
    ).toBe(1);
  });
});
