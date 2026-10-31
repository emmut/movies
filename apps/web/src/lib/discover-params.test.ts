import { describe, expect, it } from 'vite-plus/test';

import { MAJOR_STREAMING_PROVIDERS } from './config';
import { MIN_RUNTIME_FILTER_MINUTES } from './constants';
import { buildDiscoverSearchParams, getDiscoverWatchProviders } from './discover-params';
import { DEFAULT_REGION } from './regions';

const majorProviders = MAJOR_STREAMING_PROVIDERS.join('|');

describe('getDiscoverWatchProviders', () => {
  it.each([
    { url: [], saved: [8, 9], keywords: [818], expected: undefined },
    { url: [337, 15], saved: [8, 9], keywords: [818], expected: '337|15' },
    { url: [], saved: [8, 9], keywords: [], expected: '8|9' },
    { url: [337], saved: [8, 9], keywords: [], expected: '337' },
    { url: [], saved: [], keywords: [818], expected: undefined },
    { url: [], saved: [], keywords: [], expected: undefined },
  ])(
    'resolves URL $url, saved $saved and keywords $keywords',
    ({ url, saved, keywords, expected }) => {
      expect(getDiscoverWatchProviders(url, saved, keywords)).toBe(expected);
    },
  );
});

describe('buildDiscoverSearchParams', () => {
  it('combines keywords with genres, pagination and explicit provider filters', () => {
    expect(
      buildDiscoverSearchParams({
        keywordIds: [818, 4379],
        genreIds: [28],
        page: 2,
        sortBy: 'vote_count.desc',
        watchProviders: '8|9',
        watchRegion: 'US',
      }),
    ).toMatchObject({
      with_keywords: '818|4379',
      with_genres: '28',
      page: 2,
      sort_by: 'vote_count.desc',
      include_adult: 'false',
      with_watch_providers: '8|9',
      watch_region: 'US',
    });
  });

  it('does not silently restrict keyword archives to major streaming providers', () => {
    const params = buildDiscoverSearchParams({ keywordIds: [818], genreIds: [], page: 1 });
    expect(params.with_keywords).toBe('818');
    expect(params).not.toHaveProperty('with_watch_providers');
    expect(params).not.toHaveProperty('watch_region');
  });

  it('omits the keyword filter when none are selected', () => {
    expect(buildDiscoverSearchParams({ keywordIds: [], genreIds: [], page: 1 })).not.toHaveProperty(
      'with_keywords',
    );
  });
  it('applies defaults and the major-provider fallback when nothing extra is given', () => {
    expect(buildDiscoverSearchParams({ keywordIds: [], genreIds: [], page: 1 })).toEqual({
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
      buildDiscoverSearchParams({
        keywordIds: [],
        genreIds: [28],
        page: 2,
        sortBy: 'vote_average.desc',
      }),
    ).toMatchObject({
      page: 2,
      sort_by: 'vote_average.desc',
      with_genres: '28',
    });

    expect(buildDiscoverSearchParams({ keywordIds: [], genreIds: [], page: 1 })).not.toHaveProperty(
      'with_genres',
    );
  });

  it('joins multiple genres with a pipe (OR semantics)', () => {
    expect(
      buildDiscoverSearchParams({ keywordIds: [], genreIds: [28, 35], page: 1 }),
    ).toMatchObject({
      with_genres: '28|35',
    });
  });

  it('uses the explicit watch-provider filter when both providers and region are set', () => {
    expect(
      buildDiscoverSearchParams({
        keywordIds: [],
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
    expect(
      buildDiscoverSearchParams({ keywordIds: [], genreIds: [], page: 1, watchRegion: 'GB' }),
    ).toMatchObject({
      with_watch_providers: majorProviders,
      watch_region: 'GB',
    });
  });

  it('resolves results for the caller region, not the default one', () => {
    expect(
      buildDiscoverSearchParams({ keywordIds: [], genreIds: [], page: 1, watchRegion: 'US' }),
    ).toMatchObject({
      region: 'US',
    });

    expect(
      buildDiscoverSearchParams({
        keywordIds: [],
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
      buildDiscoverSearchParams({
        keywordIds: [],
        genreIds: [],
        page: 1,
        withOriginCountry: 'SE|KR',
      }),
    ).toMatchObject({
      with_origin_country: 'SE|KR',
    });

    expect(buildDiscoverSearchParams({ keywordIds: [], genreIds: [], page: 1 })).not.toHaveProperty(
      'with_origin_country',
    );
  });

  it('skips the major-provider fallback when filtering by origin country', () => {
    const params = buildDiscoverSearchParams({
      keywordIds: [],
      genreIds: [],
      page: 1,
      withOriginCountry: 'IR',
    });
    expect(params).not.toHaveProperty('with_watch_providers');
    expect(params).not.toHaveProperty('watch_region');
  });

  it('keeps an explicit provider filter alongside the origin-country filter', () => {
    expect(
      buildDiscoverSearchParams({
        keywordIds: [],
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
    expect(
      buildDiscoverSearchParams({ keywordIds: [], genreIds: [], page: 1, withRuntimeLte: 120 }),
    ).toMatchObject({
      'with_runtime.lte': 120,
      'with_runtime.gte': MIN_RUNTIME_FILTER_MINUTES,
    });

    expect(
      buildDiscoverSearchParams({ keywordIds: [], genreIds: [], page: 1, withRuntimeLte: 0 }),
    ).not.toHaveProperty('with_runtime.lte');
  });
});
