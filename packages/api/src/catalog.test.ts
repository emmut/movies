import { describe, expect, it } from 'vitest';

import { catalogDetailInput, parseCatalogId } from './catalog';

describe('catalog identity', () => {
  it.each(['42', '1', '9007199254740991'])('accepts decimal route ID %s', (value) => {
    expect(parseCatalogId(value)).toBe(Number(value));
  });
  it.each([
    undefined,
    ['42'],
    '',
    '0',
    '-1',
    '1.5',
    '1e2',
    '0x10',
    ' 42',
    '01',
    '9007199254740992',
  ])('rejects invalid route ID %s', (value) => {
    expect(parseCatalogId(value)).toBeNull();
  });
  it('uses the shared default region', () => {
    expect(catalogDetailInput.parse({ id: 42, type: 'movie' })).toEqual({
      id: 42,
      type: 'movie',
      region: 'SE',
    });
  });
  it.each([
    { id: 0, type: 'movie' },
    { id: 42.5, type: 'tv' },
    { id: 42, type: 'person' },
    { id: 42, type: 'movie', region: 'XX' },
  ])('rejects unsupported request input', (input) => {
    expect(catalogDetailInput.safeParse(input).success).toBe(false);
  });
});
