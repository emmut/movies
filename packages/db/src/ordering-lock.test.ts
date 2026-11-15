import {
  createOrderingLock,
  listItemOrderingScope,
  listOrderingScope,
  nextPosition,
  rewriteListItemPositions,
  rewriteListPositions,
} from '@movies/db/ordering-lock';
import { listItems, lists } from '@movies/db/schema/lists';
import { eq, type SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { chain } from '@/test/db-chain';
const db = { transaction: vi.fn() };
const withOrderingLock = createOrderingLock(db as never);

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

describe('nextPosition', () => {
  it('appends after the highest existing position', async () => {
    const select = vi.fn(() => chain([{ lastPosition: 4 }]));

    await expect(
      nextPosition({ select } as never, listItems, eq(listItems.listId, 'list-1')),
    ).resolves.toBe(5);
  });

  it('starts at 1 for an empty ordering', async () => {
    const select = vi.fn(() => chain([{ lastPosition: null }]));

    await expect(nextPosition({ select } as never, lists, undefined)).resolves.toBe(1);
  });
});

/** Records an update chain so the statement parts can be rendered. */
function recordUpdate() {
  const calls: { table?: unknown; set?: Record<string, unknown>; from?: SQL; where?: SQL } = {};
  const builder = {
    set(values: Record<string, unknown>) {
      calls.set = values;
      return builder;
    },
    from(source: SQL) {
      calls.from = source;
      return builder;
    },
    async where(condition: SQL) {
      calls.where = condition;
    },
  };
  const tx = {
    update(table: unknown) {
      calls.table = table;
      return builder;
    },
  };
  return { tx: tx as never, calls };
}

function render(fragment: SQL | undefined) {
  return new PgDialect().sqlToQuery(fragment as SQL);
}

describe('rewriteListPositions', () => {
  it('numbers the user’s lists from the id order without bumping updated_at', async () => {
    const { tx, calls } = recordUpdate();

    await rewriteListPositions(tx, 'user-1', ['b', 'a']);

    expect(calls.table).toBe(lists);
    expect(Object.keys(calls.set ?? {})).toEqual(['position', 'updatedAt']);
    expect(render(calls.from)).toMatchObject({ params: [['b', 'a']] });
    expect(render(calls.from).sql).toContain('with ordinality as ord(id, position)');
    expect(render(calls.where)).toMatchObject({ params: ['user-1'] });
  });
});

describe('rewriteListItemPositions', () => {
  it('numbers the list’s items from the id order', async () => {
    const { tx, calls } = recordUpdate();

    await rewriteListItemPositions(tx, 'list-1', ['x', 'y']);

    expect(calls.table).toBe(listItems);
    expect(Object.keys(calls.set ?? {})).toEqual(['position']);
    expect(render(calls.from)).toMatchObject({ params: [['x', 'y']] });
    expect(render(calls.where).sql).toContain('"list_items"."list_id" = $1');
  });
});
