import { describe, expect, it } from 'vitest';

import { discoveryInput, discoveryOptionsInput } from './discover';

describe('discovery contract', () => {
  it('normalizes the complete anonymous default state', () => {
    expect(discoveryInput.parse({})).toEqual({
      type: 'movie',
      region: 'SE',
      page: 1,
      genreIds: [],
      providerIds: [],
      originCountries: [],
      sortBy: 'popularity.desc',
    });
  });
  it('supports movie and TV sorts with positive runtime and OR selections', () => {
    expect(
      discoveryInput.parse({
        type: 'tv',
        sortBy: 'first_air_date.asc',
        genreIds: [1, 2],
        providerIds: [8, 9],
        originCountries: ['SE', 'US'],
        runtime: 120,
        page: 500,
        region: 'US',
      }),
    ).toMatchObject({ type: 'tv', runtime: 120, page: 500 });
  });
  it.each([
    { type: 'person' },
    { region: 'XX' },
    { page: 0 },
    { page: 501 },
    { page: 1.5 },
    { genreIds: [-1] },
    { providerIds: [0] },
    { runtime: 0 },
    { runtime: 601 },
    { originCountries: ['USA'] },
    { sortBy: 'invalid' },
    { type: 'tv', sortBy: 'revenue.desc' },
    { genreIds: Array.from({ length: 51 }, () => 1) },
  ])('rejects malformed or unsupported filters %j', (input) => {
    expect(discoveryInput.safeParse(input).success).toBe(false);
  });
  it('uses the same type and region defaults for choices', () => {
    expect(discoveryOptionsInput.parse({})).toEqual({ type: 'movie', region: 'SE' });
  });
});
