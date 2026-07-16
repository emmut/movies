import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/user-actions', () => ({
  getUserRegion: vi.fn(),
  getUserWatchProviders: vi.fn(),
  getWatchProviders: vi.fn(),
}));

import { getUserRegion, getUserWatchProviders, getWatchProviders } from '@/lib/user-actions';

import { getWatchProviderFilterContext } from './watch-provider-filter-context';

const netflix = { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png', display_priority: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUserRegion).mockResolvedValue('SE');
  vi.mocked(getUserWatchProviders).mockResolvedValue([8]);
  vi.mocked(getWatchProviders).mockResolvedValue([netflix]);
});

describe('getWatchProviderFilterContext', () => {
  it('uses the URL region without reading the stored region', async () => {
    const result = await getWatchProviderFilterContext('US');

    expect(result).toEqual({ userRegion: 'US', availableWatchProviders: [netflix] });
    expect(getUserRegion).not.toHaveBeenCalled();
    expect(getWatchProviders).toHaveBeenCalledWith('US', [8]);
  });

  it('falls back to the stored region when the URL pins none', async () => {
    const result = await getWatchProviderFilterContext(null);

    expect(result.userRegion).toBe('SE');
    expect(getWatchProviders).toHaveBeenCalledWith('SE', [8]);
  });
});
