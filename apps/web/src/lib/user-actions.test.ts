import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: { update: vi.fn(), insert: vi.fn(), delete: vi.fn(), select: vi.fn() },
}));
vi.mock('@/lib/auth-server', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/cache-invalidation', () => ({ revalidateUserPreferenceCache: vi.fn() }));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
}));
// The watch-provider fetchers hit TMDB; stub the network layer so importing the
// module never reaches a real fetch.
vi.mock('./tmdb', () => ({ tmdbFetch: vi.fn() }));

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth-server';
import { revalidateUserPreferenceCache } from '@/lib/cache-invalidation';
import { db } from '@/lib/db';
import { chain } from '@/test/db-chain';

import { setUserWatchProviders, updateUserRegion } from './user-actions';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as never);
  vi.mocked(db.update).mockReturnValue(chain(undefined));
  vi.mocked(db.delete).mockReturnValue(chain(undefined));
});

describe('updateUserRegion', () => {
  it('rejects when there is no session', async () => {
    vi.mocked(getSession).mockResolvedValue(null as never);
    await expect(updateUserRegion('US')).rejects.toThrow('Unauthorized');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('persists a valid region, revalidates caches/paths, and returns it', async () => {
    const result = await updateUserRegion('US');

    expect(result).toEqual({ success: true, region: 'US' });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(revalidateUserPreferenceCache).toHaveBeenCalledWith('user-1');
    expect(revalidatePath).toHaveBeenCalledWith('/settings');
    expect(revalidatePath).toHaveBeenCalledWith('/discover');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('rejects a well-formed but unknown region code without writing', async () => {
    await expect(updateUserRegion('XX')).rejects.toThrow('Invalid region code');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects an empty region (schema min length)', async () => {
    await expect(updateUserRegion('')).rejects.toThrow();
    expect(db.update).not.toHaveBeenCalled();
  });
});

describe('setUserWatchProviders', () => {
  it('rejects when there is no session', async () => {
    vi.mocked(getSession).mockResolvedValue(null as never);
    await expect(setUserWatchProviders([8])).rejects.toThrow('Unauthorized');
  });

  it('deletes all rows and inserts nothing when given an empty list', async () => {
    await setUserWatchProviders([]);

    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.insert).not.toHaveBeenCalled();
    expect(revalidateUserPreferenceCache).toHaveBeenCalledWith('user-1');
  });

  it('dedupes ids, inserts them, then prunes anything not in the set', async () => {
    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
    const valuesSpy = vi.fn().mockReturnValue({ onConflictDoNothing });
    vi.mocked(db.insert).mockReturnValue({ values: valuesSpy } as never);

    await setUserWatchProviders([8, 8, 9]);

    expect(valuesSpy).toHaveBeenCalledTimes(1);
    const inserted = valuesSpy.mock.calls[0][0] as Array<{ providerId: number; userId: string }>;
    expect(inserted.map((row) => row.providerId)).toEqual([8, 9]);
    expect(inserted.every((row) => row.userId === 'user-1')).toBe(true);
    expect(onConflictDoNothing).toHaveBeenCalledTimes(1);
    // Prune pass removes providers no longer selected.
    expect(db.delete).toHaveBeenCalledTimes(1);
  });
});
