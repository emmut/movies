import { readDiscoverState, toggleSelection } from '@native/lib/discover-state';
import { describe, expect, it } from 'vitest';

describe('native discovery URL state', () => {
  it('defaults malformed bounds, type and sort without crashing a deep link', () => {
    expect(
      readDiscoverState(
        { page: '501', mediaType: 'person', sort_by: 'invalid', runtime: '-1', watch_region: 'XX' },
        'SE',
      ),
    ).toMatchObject({
      page: 1,
      type: 'movie',
      sortBy: 'popularity.desc',
      runtime: undefined,
      region: 'SE',
    });
  });
  it('preserves filter values and the historical genre URL key', () => {
    expect(
      readDiscoverState(
        {
          genreId: ['12,28'],
          page: '2',
          runtime: '90',
          mediaType: 'tv',
          sort_by: 'first_air_date.desc',
          with_watch_providers: '8|9',
          with_origin_country: 'SE|US',
          watch_region: 'US',
        },
        'SE',
      ),
    ).toEqual({
      page: 2,
      type: 'tv',
      genreIds: [12, 28],
      providerIds: [8, 9],
      originCountries: ['SE', 'US'],
      runtime: 90,
      region: 'US',
      sortBy: 'first_air_date.desc',
    });
  });
  it('clears region back to session region and ignores malformed selection values', () => {
    expect(
      readDiscoverState(
        { watch_region: '', genreId: '-1,abc,0,12', with_origin_country: 'USA|SE' },
        'US',
      ),
    ).toMatchObject({ region: 'US', genreIds: [12], originCountries: ['SE'] });
  });
  it('retains other selected options when toggling one on or off', () => {
    expect(toggleSelection(['8'], '9')).toEqual(['8', '9']);
    expect(toggleSelection(['8', '9'], '8')).toEqual(['9']);
  });
});
