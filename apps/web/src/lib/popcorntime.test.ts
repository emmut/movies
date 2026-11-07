import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/db', () => ({ db: { select: vi.fn() } }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));

import { db } from '@/lib/db';
import { chain } from '@/test/db-chain';

import { getPopcorntimeWatchLinks } from './popcorntime';

beforeEach(() => vi.clearAllMocks());

describe('Popcorn Time link lookup', () => {
  it('returns scoped redirect links without exposing an API credential', async () => {
    const token = '3xK9mPv2bQ7nRtYsABCDEFGHJKLMN';
    vi.mocked(db.select).mockReturnValue(
      chain([{ token, providerId: 426, region: 'SE', offerType: 'rent' }]),
    );
    expect(await getPopcorntimeWatchLinks('movie', 123)).toEqual([
      {
        source: 'popcorntime',
        providerId: 426,
        regions: ['SE'],
        types: ['rent'],
        url: `https://popcorntime.app/go/${token}`,
      },
    ]);
  });

  it('leaves the existing fallbacks usable during database failures', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('offline');
    });
    expect(await getPopcorntimeWatchLinks('movie', 123)).toEqual([]);
    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
  });
});
