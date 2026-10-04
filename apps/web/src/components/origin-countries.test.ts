import { describe, expect, it } from 'vitest';

import { getOriginCountriesModel } from './origin-countries';

describe('getOriginCountriesModel', () => {
  it('returns null when TMDb omits the field', () => {
    expect(getOriginCountriesModel(undefined, 'movie')).toBeNull();
  });

  it('returns null when there are no codes', () => {
    expect(getOriginCountriesModel([], 'movie')).toBeNull();
  });

  it('returns null when every code is invalid', () => {
    expect(getOriginCountriesModel(['XX', 'not-a-code'], 'tv')).toBeNull();
  });

  it('builds a flag, name, and discover link per country', () => {
    expect(getOriginCountriesModel(['SE'], 'movie')).toEqual({
      heading: 'Country of Origin',
      pills: [
        {
          code: 'SE',
          flag: '🇸🇪',
          name: 'Sweden',
          href: '/discover?with_origin_country=SE&mediaType=movie',
        },
      ],
    });
  });

  it('links tv items to tv discover', () => {
    const model = getOriginCountriesModel(['KR'], 'tv');
    expect(model?.pills[0].href).toBe('/discover?with_origin_country=KR&mediaType=tv');
  });

  it('pluralizes the heading for co-productions', () => {
    const model = getOriginCountriesModel(['US', 'GB'], 'movie');
    expect(model?.heading).toBe('Countries of Origin');
    expect(model?.pills.map((pill) => pill.code)).toEqual(['US', 'GB']);
  });

  it('drops invalid codes but keeps valid ones', () => {
    const model = getOriginCountriesModel(['XX', 'JP'], 'movie');
    expect(model?.heading).toBe('Country of Origin');
    expect(model?.pills.map((pill) => pill.code)).toEqual(['JP']);
  });
});
