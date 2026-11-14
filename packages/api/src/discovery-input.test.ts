import { describe, expect, it } from 'vite-plus/test';

import { discoveryInputFromParams } from './discovery-input';

describe('discovery URL input', () => {
  it('preserves multi-select, region, pagination, runtime and named filters for both apps', () => {
    expect(
      discoveryInputFromParams('tv', {
        page: 2,
        genreIds: [18],
        keywordIds: [42],
        companyIds: [7],
        networkIds: [9],
        sortBy: 'vote_count.desc',
        watchProviders: '8|9',
        watchRegion: 'US',
        withOriginCountry: 'US|GB',
        withRuntimeLte: 90,
      }),
    ).toMatchObject({
      type: 'tv',
      sortBy: 'vote_count.desc',
      region: 'US',
      page: 2,
      genreIds: [18],
      keywordIds: [42],
      companyIds: [7],
      networkIds: [9],
      providerIds: [8, 9],
      originCountries: ['US', 'GB'],
      runtime: 90,
    });
  });
  it('validates malformed provider IDs at the common boundary', () => {
    expect(() =>
      discoveryInputFromParams('movie', {
        genreIds: [],
        keywordIds: [],
        page: 1,
        watchProviders: '8|invalid',
      }),
    ).toThrow();
  });
});
