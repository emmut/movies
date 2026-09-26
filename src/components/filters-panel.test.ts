import { describe, expect, it } from 'vitest';

import { getActiveFilterCount, getFilterButtonLabel } from './filters-panel';

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
