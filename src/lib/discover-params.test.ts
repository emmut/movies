import { describe, expect, it } from 'vitest';

import { MAJOR_STREAMING_PROVIDERS } from './config';
import { MIN_RUNTIME_FILTER_MINUTES } from './constants';
import { buildDiscoverSearchParams } from './discover-params';
import { DEFAULT_REGION } from './regions';

const majorProviders = MAJOR_STREAMING_PROVIDERS.join('|');

describe('buildDiscoverSearchParams', () => {
  it('applies defaults and the major-provider fallback when nothing extra is given', () => {
    expect(buildDiscoverSearchParams({ genreId: 0, page: 1 })).toEqual({
      page: 1,
      sort_by: 'popularity.desc',
      region: DEFAULT_REGION,
      include_adult: 'false',
      with_watch_providers: majorProviders,
      watch_region: DEFAULT_REGION,
    });
  });

  it('includes the genre filter only when genreId is non-zero', () => {
    expect(buildDiscoverSearchParams({ genreId: 28, page: 2, sortBy: 'vote_average.desc' })).toMatchObject({
      page: 2,
      sort_by: 'vote_average.desc',
      with_genres: 28,
    });

    expect(buildDiscoverSearchParams({ genreId: 0, page: 1 })).not.toHaveProperty('with_genres');
  });

  it('uses the explicit watch-provider filter when both providers and region are set', () => {
    expect(
      buildDiscoverSearchParams({
        genreId: 0,
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
    expect(buildDiscoverSearchParams({ genreId: 0, page: 1, watchRegion: 'GB' })).toMatchObject({
      with_watch_providers: majorProviders,
      watch_region: 'GB',
    });
  });

  it('applies the runtime filter only for a positive max runtime', () => {
    expect(buildDiscoverSearchParams({ genreId: 0, page: 1, withRuntimeLte: 120 })).toMatchObject({
      'with_runtime.lte': 120,
      'with_runtime.gte': MIN_RUNTIME_FILTER_MINUTES,
    });

    expect(buildDiscoverSearchParams({ genreId: 0, page: 1, withRuntimeLte: 0 })).not.toHaveProperty(
      'with_runtime.lte',
    );
  });
});
