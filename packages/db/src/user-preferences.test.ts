import { describe, expect, it } from 'vitest';

import { createUserPreferenceStore, UserNotFoundError } from './user-preferences';

/** A drizzle stand-in whose every builder step resolves to `rows`. */
function fakeDatabase(rows: unknown[]) {
  const builder: object = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === 'then') {
          return (resolve: (value: unknown[]) => unknown) => resolve(rows);
        }
        return () => builder;
      },
    },
  );
  return builder as never;
}

describe('user preference store', () => {
  it.each([
    [[{ region: 'NO' }], 'NO'],
    [[{ region: null }], 'SE'],
    [[{ region: 'XX' }], 'SE'],
  ])('reads %j as %s', async (rows, expected) => {
    expect(await createUserPreferenceStore(fakeDatabase(rows)).readRegion('user-1')).toBe(expected);
  });
  it('reports a missing account on read and write', async () => {
    const store = createUserPreferenceStore(fakeDatabase([]));
    await expect(store.readRegion('missing')).rejects.toBeInstanceOf(UserNotFoundError);
    await expect(store.writeRegion('missing', 'US')).rejects.toThrow('User not found');
  });
  it('returns the stored region after a write', async () => {
    const store = createUserPreferenceStore(fakeDatabase([{ id: 'user-1' }]));
    expect(await store.writeRegion('user-1', 'US')).toBe('US');
  });
});
