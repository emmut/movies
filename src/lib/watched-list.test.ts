import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { select: vi.fn(), insert: vi.fn() } }));

import { db } from '@/lib/db';

import { chain } from '@/test/db-chain';

import { getOrCreateWatchedListId, getWatchedListId } from './watched-list';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getWatchedListId', () => {
  it('returns the list id when the user has a watched list', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ id: 'list-1' }]));

    await expect(getWatchedListId('user-1')).resolves.toBe('list-1');
  });

  it('returns null when the user has no watched list', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));

    await expect(getWatchedListId('user-1')).resolves.toBeNull();
  });
});

describe('getOrCreateWatchedListId', () => {
  it('returns the existing list id without inserting', async () => {
    vi.mocked(db.select).mockReturnValue(chain([{ id: 'list-1' }]));

    await expect(getOrCreateWatchedListId('user-1')).resolves.toBe('list-1');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('creates the list when missing and returns the new id', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));
    vi.mocked(db.insert).mockReturnValue(chain([{ id: 'list-new' }]));

    await expect(getOrCreateWatchedListId('user-1')).resolves.toBe('list-new');
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('re-selects the winner when a concurrent create won the race', async () => {
    // First select: nothing; insert suppressed by the partial unique index;
    // second select: the row the concurrent request created.
    vi.mocked(db.select)
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([{ id: 'list-winner' }]));
    vi.mocked(db.insert).mockReturnValue(chain([]));

    await expect(getOrCreateWatchedListId('user-1')).resolves.toBe('list-winner');
  });

  it('throws when the list can be neither found nor created', async () => {
    vi.mocked(db.select).mockReturnValue(chain([]));
    vi.mocked(db.insert).mockReturnValue(chain([]));

    await expect(getOrCreateWatchedListId('user-1')).rejects.toThrow(
      'Failed to create watched list',
    );
  });
});
