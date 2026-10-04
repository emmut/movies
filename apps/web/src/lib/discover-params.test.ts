import { describe, expect, it } from 'vitest';

import { MAJOR_STREAMING_PROVIDERS } from './config';
import { MIN_RUNTIME_FILTER_MINUTES } from './constants';
import { buildDiscoverSearchParams } from './discover-params';
import { DEFAULT_REGION } from './regions';

const majorProviders = MAJOR_STREAMING_PROVIDERS.join('|');

describe('buildDiscoverSearchParams', () => {
  it('applies defaults and the major-provider fallback when nothing extra is given', () => {
    expect(buildDiscoverSearchParams({ genreIds: [], page: 1 })).toEqual({
      page: 1,
      sort_by: 'popularity.desc',
      region: DEFAULT_REGION,
      include_adult: 'false',
      with_watch_providers: majorProviders,
      watch_region: DEFAULT_REGION,
    });
  });

  it('includes the genre filter only when genres are selected', () => {
    expect(
      buildDiscoverSearchParams({ genreIds: [28], page: 2, sortBy: 'vote_average.desc' }),
    ).toMatchObject({
      page: 2,
      sort_by: 'vote_average.desc',
      with_genres: '28',
    });

    expect(buildDiscoverSearchParams({ genreIds: [], page: 1 })).not.toHaveProperty('with_genres');
  });

  it('joins multiple genres with a pipe (OR semantics)', () => {
    expect(buildDiscoverSearchParams({ genreIds: [28, 35], page: 1 })).toMatchObject({
      with_genres: '28|35',
    });
  });

  it('uses the explicit watch-provider filter when both providers and region are set', () => {
    expect(
      buildDiscoverSearchParams({
        genreIds: [],
        page: 1,
        watchProviders: '8,9',
        watchRegion: 'US',
      }),
    ).toMatchObject({
      with_watch_providers: '8,9',
      watch_region: 'US',
    });
  });

  it('falls back to major providers but keeps the given watch region when only a region is set', () => {
    expect(buildDiscoverSearchParams({ genreIds: [], page: 1, watchRegion: 'GB' })).toMatchObject({
      with_watch_providers: majorProviders,
      watch_region: 'GB',
    });
  });

  it('resolves results for the caller region, not the default one', () => {
    expect(buildDiscoverSearchParams({ genreIds: [], page: 1, watchRegion: 'US' })).toMatchObject({
      region: 'US',
    });

    expect(
      buildDiscoverSearchParams({
        genreIds: [],
        page: 1,
        watchProviders: '8',
        watchRegion: 'US',
      }),
    ).toMatchObject({
      region: 'US',
    });
  });

  it('applies the origin-country filter only when set', () => {
    expect(
      buildDiscoverSearchParams({ genreIds: [], page: 1, withOriginCountry: 'SE|KR' }),
    ).toMatchObject({
      with_origin_country: 'SE|KR',
    });

    expect(buildDiscoverSearchParams({ genreIds: [], page: 1 })).not.toHaveProperty(
      'with_origin_country',
    );
  });

  it('skips the major-provider fallback when filtering by origin country', () => {
    const params = buildDiscoverSearchParams({ genreIds: [], page: 1, withOriginCountry: 'IR' });
    expect(params).not.toHaveProperty('with_watch_providers');
    expect(params).not.toHaveProperty('watch_region');
  });

  it('keeps an explicit provider filter alongside the origin-country filter', () => {
    expect(
      buildDiscoverSearchParams({
        genreIds: [],
        page: 1,
        withOriginCountry: 'SE',
        watchProviders: '8',
        watchRegion: 'SE',
      }),
    ).toMatchObject({
      with_origin_country: 'SE',
      with_watch_providers: '8',
      watch_region: 'SE',
    });
  });

  it('applies the runtime filter only for a positive max runtime', () => {
    expect(buildDiscoverSearchParams({ genreIds: [], page: 1, withRuntimeLte: 120 })).toMatchObject({
      'with_runtime.lte': 120,
      'with_runtime.gte': MIN_RUNTIME_FILTER_MINUTES,
    });

    expect(
      buildDiscoverSearchParams({ genreIds: [], page: 1, withRuntimeLte: 0 }),
    ).not.toHaveProperty('with_runtime.lte');
  });
});
