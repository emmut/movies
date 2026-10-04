import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { select: vi.fn(), insert: vi.fn(), delete: vi.fn() } }));
// Run the locked callback against the db mock directly; the real lock needs a
// live transaction and is covered by ordering-lock.test.ts.
vi.mock('@/lib/ordering-lock', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ordering-lock')>();
  const { db } = await import('@/lib/db');
  return {
    ...actual,
    withOrderingLock: vi.fn((_scope: string, fn: (tx: unknown) => unknown) => fn(db)),
  };
});

import { db } from '@/lib/db';
import { withOrderingLock } from '@/lib/ordering-lock';
import { chain } from '@/test/db-chain';

import { getOrCreateSystemListId, getSystemListId, toggleSystemListRow } from './system-list';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSystemListId', () => {
  it('returns the list id when the user has the system list', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ id: 'list-1' }]));

    await expect(getSystemListId('user-1', 'watchlist')).resolves.toBe('list-1');
  });

  it('returns null when the user has no such list', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));

    await expect(getSystemListId('user-1', 'watched')).resolves.toBeNull();
  });
});

describe('getOrCreateSystemListId', () => {
  it('returns the existing list id without inserting', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ id: 'list-1' }]));

    await expect(getOrCreateSystemListId('user-1', 'watchlist')).resolves.toBe('list-1');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('creates the list when missing and returns the new id', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));
    vi.mocked(db.insert).mockReturnValue(chain([{ id: 'list-new' }]));

    await expect(getOrCreateSystemListId('user-1', 'watched')).resolves.toBe('list-new');
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('re-selects the winner when a concurrent create won the race', async () => {
    // First select: nothing; insert suppressed by the partial unique index;
    // second select: the row the concurrent request created.
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([{ id: 'list-winner' }]));
    vi.mocked(db.insert).mockReturnValue(chain([]));

    await expect(getOrCreateSystemListId('user-1', 'watchlist')).resolves.toBe('list-winner');
  });

  it('throws when the list can be neither found nor created', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));
    vi.mocked(db.insert).mockReturnValue(chain([]));

    await expect(getOrCreateSystemListId('user-1', 'watched')).rejects.toThrow(
      'Failed to create watched list',
    );
  });
});

describe('toggleSystemListRow', () => {
  beforeEach(() => {
    // The user already has the system list.
    vi.mocked(db.select).mockReturnValue(chain([{ id: 'list-1' }]));
  });

  it('returns "removed" when a row was deleted, without inserting', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([{ id: 'row-1' }]));

    await expect(toggleSystemListRow('user-1', 'watchlist', 5, 'movie')).resolves.toBe('removed');
    expect(db.insert).not.toHaveBeenCalled();
    expect(withOrderingLock).not.toHaveBeenCalled();
  });

  it('returns "added" when nothing was deleted and the insert landed', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));
    vi.mocked(db.insert).mockReturnValue(chain([{ id: 'row-1' }]));

    await expect(toggleSystemListRow('user-1', 'watched', 5, 'tv')).resolves.toBe('added');
    expect(withOrderingLock).toHaveBeenCalledWith('list-items:list-1', expect.any(Function));
  });

  it('creates the list lazily on first toggle', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));
    vi.mocked(db.insert)
      .mockReturnValueOnce(chain([{ id: 'list-new' }]))
      .mockReturnValueOnce(chain([{ id: 'row-1' }]));
    vi.mocked(db.delete).mockReturnValue(chain([]));

    await expect(toggleSystemListRow('user-1', 'watched', 5, 'movie')).resolves.toBe('added');
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it('returns "unchanged" when a concurrent insert won the race (onConflictDoNothing no-op)', async () => {
    vi.mocked(db.delete).mockReturnValue(chain([]));
    // Insert was suppressed by the conflict: no row returned.
    vi.mocked(db.insert).mockReturnValue(chain([]));

    await expect(toggleSystemListRow('user-1', 'watchlist', 5, 'movie')).resolves.toBe('unchanged');
  });
});
