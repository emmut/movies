import { describe, expect, it } from 'vitest';

import {
  DEFAULT_REGION,
  getRegionByCode,
  getRegionCodes,
  isValidRegionCode,
  regions,
  regionSchema,
} from './regions';

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

describe('isValidRegionCode', () => {
  it('accepts known codes and rejects others', () => {
    expect(isValidRegionCode('SE')).toBe(true);
    expect(isValidRegionCode('ZZ')).toBe(false);
    expect(isValidRegionCode('se')).toBe(false);
  });
});

describe('getRegionCodes', () => {
  it('returns every region code in order', () => {
    expect(getRegionCodes()).toEqual(regions.map((r) => r.code));
  });
});

describe('regionSchema', () => {
  it('accepts non-empty strings and rejects empty', () => {
    expect(regionSchema.safeParse('SE').success).toBe(true);
    expect(regionSchema.safeParse('').success).toBe(false);
  });
});
