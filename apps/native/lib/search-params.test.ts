import { providerIdList, regionOr, scalar } from '@native/lib/search-params';
import { describe, expect, it } from 'vitest';

describe('native URL search params', () => {
  it('reads the first value of a repeated key', () => {
    expect(scalar(['8', '9'])).toBe('8');
    expect(scalar('8')).toBe('8');
    expect(scalar(undefined)).toBeUndefined();
  });
  it('keeps only storable provider ids in URL order, including duplicates', () => {
    expect(providerIdList('8|0|abc,-1|8|2147483647|2147483648|1.5')).toEqual([8, 8, 2147483647]);
    expect(providerIdList(['9,10', '11'])).toEqual([9, 10]);
    expect(providerIdList(undefined)).toEqual([]);
    expect(providerIdList('')).toEqual([]);
  });
  it('falls back when the URL region is missing or unknown', () => {
    expect(regionOr('US', 'SE')).toBe('US');
    expect(regionOr(['NO', 'US'], 'SE')).toBe('NO');
    expect(regionOr('XX', 'SE')).toBe('SE');
    expect(regionOr(undefined, 'SE')).toBe('SE');
  });
});
