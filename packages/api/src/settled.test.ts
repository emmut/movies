import { describe, expect, it } from 'vitest';

import { fulfilledValues } from './settled';

describe('fulfilledValues', () => {
  it('keeps resolved results in input order and drops rejections', async () => {
    const result = await fulfilledValues([1, 2, 3], async (value) => {
      if (value === 2) {
        throw new Error('gone');
      }
      return value * 10;
    });

    expect(result).toEqual([10, 30]);
  });

  it('returns an empty array for no items', async () => {
    await expect(fulfilledValues([], async (value) => value)).resolves.toEqual([]);
  });
});
