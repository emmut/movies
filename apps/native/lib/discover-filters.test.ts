import { discoveryInput } from '@movies/api/discover';
import { filterSpec } from '@native/lib/discover-filters';
import { describe, expect, it } from 'vitest';

const options = {
  genres: [{ id: 12, name: 'Adventure' }],
  providers: [{ id: 8, name: 'Netflix', logoUrl: null }],
  countries: [{ code: 'SE', name: 'Sweden' }],
};
const input = discoveryInput.parse({
  genreIds: [12],
  providerIds: [8],
  originCountries: ['SE'],
  runtime: 90,
});
describe('native filter choices', () => {
  it.each([
    { filter: 'genreId', selection: ['12'], label: 'Adventure' },
    { filter: 'with_watch_providers', selection: ['8'], label: 'Netflix' },
    { filter: 'with_origin_country', selection: ['SE'], label: 'Sweden' },
  ] as const)('preserves multi-selection for $filter', ({ filter, selection, label }) => {
    expect(filterSpec(filter, input, options)).toMatchObject({
      selected: selection,
      multiple: true,
      options: [expect.objectContaining({ label })],
    });
  });
  it('provides the shared regions, bounded runtimes and all movie/TV sort choices', () => {
    expect(filterSpec('watch_region', input, options)).toMatchObject({
      selected: ['SE'],
      multiple: false,
    });
    expect(filterSpec('runtime', input, options)).toMatchObject({
      selected: ['90'],
      multiple: false,
      options: expect.arrayContaining([
        { value: '0', label: 'Any' },
        { value: '90', label: 'Up to 90 min' },
      ]),
    });
    expect(filterSpec('runtime', discoveryInput.parse({}), options).selected).toEqual(['0']);
    expect(filterSpec('sort_by', input, options).options).toContainEqual({
      value: 'revenue.desc',
      label: 'Revenue (High to Low)',
    });
    expect(
      filterSpec('sort_by', discoveryInput.parse({ type: 'tv' }), options).options,
    ).toContainEqual({ value: 'first_air_date.desc', label: 'First Air Date (Newest)' });
    expect(
      filterSpec('sort_by', discoveryInput.parse({ type: 'tv' }), options).options.some((item) =>
        item.value.startsWith('revenue'),
      ),
    ).toBe(false);
  });
});
