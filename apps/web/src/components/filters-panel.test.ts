import { describe, expect, it } from 'vite-plus/test';

import { getFilterButtonLabel } from './filters-panel';

describe('getFilterButtonLabel', () => {
  it('uses a concise default label when no filters are active', () => {
    expect(getFilterButtonLabel(0)).toBe('Filters');
  });

  it('includes the number of active filter categories', () => {
    expect(getFilterButtonLabel(1)).toBe('Filters (1)');
    expect(getFilterButtonLabel(4)).toBe('Filters (4)');
  });
});
