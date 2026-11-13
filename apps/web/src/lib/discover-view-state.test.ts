import { createLoader } from 'nuqs/server';
import { describe, expect, it } from 'vite-plus/test';

import {
  discoverViewParsers,
  discoverViewUrlKeys,
  getActiveFilterCount,
  getAdditionalFilterCount,
  resolveDiscoverViewState,
} from './discover-view-state';

const loadView = createLoader(discoverViewParsers, { urlKeys: discoverViewUrlKeys });
const defaults = { region: 'GB', watchProviders: [8] };

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

describe('resolveDiscoverViewState', () => {
  it('uses saved preferences without treating them as explicit filters', () => {
    const urlState = loadView({});
    expect(urlState.with_watch_providers).toEqual([]);
    expect(resolveDiscoverViewState(urlState, defaults)).toEqual({
      page: 1,
      genreIds: [],
      keywordIds: [],
      companyIds: [],
      networkIds: [],
      mediaType: 'movie',
      sortBy: 'popularity.desc',
      watchProviders: '8',
      watchRegion: 'GB',
      runtimeLte: undefined,
      originCountry: undefined,
      activeFilterCount: 0,
    });
  });

  it('resolves explicit filters and counts selections consistently', () => {
    const view = resolveDiscoverViewState(
      loadView({
        page: '2',
        mediaType: 'tv',
        genreId: '18,35',
        keywordId: '818',
        companyId: '2,3',
        networkId: '49,213',
        sort_by: 'vote_count.desc',
        runtime: '90',
        with_origin_country: 'SE,KR',
        with_watch_providers: '9,337',
        watch_region: 'US',
      }),
      defaults,
    );
    expect(view).toEqual({
      page: 2,
      genreIds: [18, 35],
      keywordIds: [818],
      companyIds: [2, 3],
      networkIds: [49, 213],
      mediaType: 'tv',
      sortBy: 'vote_count.desc',
      watchProviders: '9|337',
      watchRegion: 'US',
      runtimeLte: 90,
      originCountry: 'SE|KR',
      activeFilterCount: 9,
    });
  });

  it.each([{ keywordId: '818' }, { companyId: '41077' }, { networkId: '49', mediaType: 'tv' }])(
    'does not restrict archive browsing to saved providers: %j',
    (params) => {
      const view = resolveDiscoverViewState(loadView(params), defaults);
      expect(view.watchProviders).toBeUndefined();
      expect(view.activeFilterCount).toBe(1);
    },
  );

  it('ignores TV-only networks in movie mode, including their effect on preferences and counts', () => {
    const view = resolveDiscoverViewState(loadView({ networkId: '49' }), defaults);
    expect(view.networkIds).toEqual([]);
    expect(view.watchProviders).toBe('8');
    expect(view.activeFilterCount).toBe(0);
  });

  it('allows browsing without saved providers or an explicit region', () => {
    const view = resolveDiscoverViewState(loadView({}), { region: 'SE', watchProviders: [] });
    expect(view.watchProviders).toBeUndefined();
    expect(view.watchRegion).toBe('SE');
  });
});
