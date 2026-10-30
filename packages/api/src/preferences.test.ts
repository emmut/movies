import { describe, expect, it } from 'vite-plus/test';

import {
  getWatchProvidersString,
  providerPreferenceSchema,
  resolveWatchProviderIds,
} from './preferences';

describe('provider preferences', () => {
  it.each([0, -1, 1.5, 2_147_483_648, '8', NaN])(
    'rejects invalid database provider ID %s',
    (id) => {
      expect(providerPreferenceSchema.safeParse({ providerIds: [id] }).success).toBe(false);
    },
  );
  it('deduplicates and normalizes a complete replacement, including clear-all', () => {
    expect(providerPreferenceSchema.parse({ providerIds: [337, 8, 8] })).toEqual({
      providerIds: [8, 337],
    });
    expect(providerPreferenceSchema.parse({ providerIds: [] })).toEqual({ providerIds: [] });
  });
  it('preserves all saved services when there are more than 50', () => {
    const providerIds = Array.from({ length: 70 }, (_, i) => i + 1);
    expect(providerPreferenceSchema.parse({ providerIds }).providerIds).toEqual(providerIds);
  });
  it('uses explicit discovery providers before account defaults; clearing restores defaults', () => {
    expect(resolveWatchProviderIds([9], [8])).toEqual([9]);
    expect(resolveWatchProviderIds([], [8])).toEqual([8]);
    expect(getWatchProvidersString([], [])).toBeUndefined();
    expect(getWatchProvidersString([9], [8])).toBe('9');
    expect(getWatchProvidersString([], [8, 337])).toBe('8|337');
  });
});
