import { createDatabase, requireDatabase } from '@server/database';
import { drizzle } from 'drizzle-orm/node-postgres';
import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('drizzle-orm/node-postgres', () => ({ drizzle: vi.fn() }));

describe('requireDatabase', () => {
  it('rejects with the feature that needs a database', async () => {
    await expect(requireDatabase('System lists')()).rejects.toThrow(
      'System lists require DATABASE_URL',
    );
  });
});

describe('API database pool', () => {
  it('is absent without a URL so TMDB-backed reads keep working', () => {
    expect(createDatabase()).toBeUndefined();
    expect(drizzle).not.toHaveBeenCalled();
  });
  it('opens one bounded, kept-alive pool', () => {
    const database = {};
    vi.mocked(drizzle).mockReturnValue(database as never);
    expect(createDatabase('postgres://localhost/movies', 4)).toBe(database);
    expect(drizzle).toHaveBeenCalledWith({
      connection: {
        connectionString: 'postgres://localhost/movies',
        max: 4,
        min: 1,
        keepAlive: true,
        idleTimeoutMillis: 300000,
        connectionTimeoutMillis: 60000,
      },
    });
  });
});
