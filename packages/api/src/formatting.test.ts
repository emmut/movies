import { describe, expect, it } from 'vite-plus/test';

import { formatCompactNumber } from './formatting';

describe('formatCompactNumber', () => {
  it('compacts thousands and millions to one decimal', () => {
    expect(formatCompactNumber(30755)).toBe('30.8K');
    expect(formatCompactNumber(3206008)).toBe('3.2M');
    expect(formatCompactNumber(185)).toBe('185');
  });
});
