import { describe, expect, it } from 'vitest';

import { DEFAULT_REGION, getRegionByCode, getRegionCodes, regions, regionSchema } from './regions';

describe('regions data', () => {
  it('has a unique code per region', () => {
    const codes = regions.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('lists DEFAULT_REGION as a real region', () => {
    expect(getRegionByCode(DEFAULT_REGION)).toBeDefined();
  });
});

describe('getRegionByCode', () => {
  it('returns the matching region', () => {
    expect(getRegionByCode('US')).toEqual({ code: 'US', name: 'United States' });
  });

  it('returns undefined for unknown codes', () => {
    expect(getRegionByCode('ZZ')).toBeUndefined();
    expect(getRegionByCode('')).toBeUndefined();
  });

  it('is case-sensitive', () => {
    expect(getRegionByCode('us')).toBeUndefined();
  });
});

describe('getRegionCodes', () => {
  it('returns every region code in order', () => {
    expect(getRegionCodes()).toEqual(regions.map((r) => r.code));
  });
});

describe('regionSchema', () => {
  it('accepts every supported region', () => {
    for (const code of getRegionCodes()) {
      expect(regionSchema.safeParse(code).success).toBe(true);
    }
  });

  it('rejects empty, unknown, lowercase, and non-string values', () => {
    for (const code of ['', 'ZZ', 'se', null, 123]) {
      expect(regionSchema.safeParse(code).success).toBe(false);
    }
  });
});
