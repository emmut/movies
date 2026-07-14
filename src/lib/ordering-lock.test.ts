import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { transaction: vi.fn() } }));

import { db } from '@/lib/db';

import { listItemOrderingScope, listOrderingScope, withOrderingLock } from './ordering-lock';

const tx = { execute: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.transaction).mockImplementation(((fn: (tx: unknown) => unknown) => fn(tx)) as never);
});

describe('withOrderingLock', () => {
  it('acquires the advisory lock on the scope before running the callback', async () => {
    const order: string[] = [];
    tx.execute.mockImplementation(async () => {
      order.push('lock');
    });

    await withOrderingLock('lists:user-1', async () => {
      order.push('callback');
    });

    expect(order).toEqual(['lock', 'callback']);
    const lockQuery = tx.execute.mock.calls[0][0];
    expect(JSON.stringify(lockQuery)).toContain('pg_advisory_xact_lock');
    expect(JSON.stringify(lockQuery)).toContain('lists:user-1');
  });

  it('runs the callback inside the transaction and returns its result', async () => {
    await expect(withOrderingLock('lists:user-1', async () => 'result')).resolves.toBe('result');
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it('propagates a callback rejection', async () => {
    await expect(
      withOrderingLock('lists:user-1', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});

describe('ordering scopes', () => {
  it('scopes list ordering per user', () => {
    expect(listOrderingScope('user-1')).toBe('lists:user-1');
  });

  it('scopes item ordering per list', () => {
    expect(listItemOrderingScope('list-1')).toBe('list-items:list-1');
  });

  it('keeps the two scopes disjoint for the same id', () => {
    expect(listOrderingScope('x')).not.toBe(listItemOrderingScope('x'));
  });
});
