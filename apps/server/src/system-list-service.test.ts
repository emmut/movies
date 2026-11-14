import { systemListPageInput } from '@movies/api/system-lists';
import { ListItemNotFoundError } from '@movies/db/list-item-order';
import type { Database } from '@server/database';
import { createSystemListService } from '@server/system-list-service';
import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mocks = vi.hoisted(() => ({
  store: {
    pageRows: vi.fn(),
    countItems: vi.fn(),
    membership: vi.fn(),
    toggleSystemListRow: vi.fn(),
  },
  move: vi.fn(),
  sync: vi.fn(),
  ensure: vi.fn(),
  providers: vi.fn(),
}));
vi.mock('@movies/db/system-lists', () => ({ createSystemListStore: () => mocks.store }));
vi.mock('@movies/db/list-item-order', async (actual) => ({
  ...(await actual<typeof import('@movies/db/list-item-order')>()),
  createListItemOrderingStore: () => ({ move: mocks.move }),
}));
vi.mock('@movies/db/title-availability', () => ({ ensureTitleAvailability: mocks.ensure }));
vi.mock('@movies/db/title-sync', () => ({ syncTitle: mocks.sync }));
vi.mock('@movies/db/user-preferences', () => ({
  createUserPreferenceStore: () => ({ readProviders: mocks.providers }),
}));
const itemId = '00000000-0000-4000-8000-000000000001';
const database = {} as Database;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.store.pageRows.mockResolvedValue({
    items: [{ id: itemId, resourceId: 42, resourceType: 'movie' }],
    totalItems: 1,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 20,
  });
  mocks.store.countItems.mockImplementation(async (_user, _list, type) =>
    type === 'movie' ? 1 : 3,
  );
  mocks.store.membership.mockImplementation(async (_user, listType) => listType === 'watchlist');
  mocks.store.toggleSystemListRow.mockResolvedValue('added');
  mocks.move.mockResolvedValue(undefined);
  mocks.sync.mockResolvedValue('synced');
  mocks.providers.mockResolvedValue([]);
});

describe('system list host service', () => {
  it('uses scoped rows/counts and normalizes artwork, dates and identifiers', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ id: 42, title: 'Movie', poster_path: null, vote_average: 8 });
    const result = await createSystemListService(database, fetcher, vi.fn()).page(
      'owner',
      systemListPageInput.parse({ listType: 'watchlist' }),
    );
    expect(result).toMatchObject({
      counts: { movie: 1, tv: 3 },
      unavailableItems: 0,
      totalItems: 1,
      itemsPerPage: 20,
    });
    expect(result.items[0]).toMatchObject({
      id: 42,
      listItemId: itemId,
      title: 'Movie',
      releaseDate: '',
      posterUrl: null,
    });
    expect(mocks.store.countItems).toHaveBeenCalledWith('owner', 'watchlist', 'movie');
    expect(mocks.store.countItems).toHaveBeenCalledWith('owner', 'watchlist', 'tv');
  });
  it('catches up unknown availability with the canonical source before a filtered read', async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 42, title: 'Movie' });
    const input = systemListPageInput.parse({
      listType: 'watched',
      providerIds: [8],
      region: 'NO',
      page: 7,
    });
    await createSystemListService(database, fetcher, vi.fn()).page('owner', input);
    expect(mocks.store.pageRows.mock.calls[0].slice(0, 5)).toEqual([
      'owner',
      'watched',
      'movie',
      7,
      { providerIds: [8], region: 'NO' },
    ]);
    const scope = sql`owner_scope`;
    await mocks.store.pageRows.mock.calls[0][5](scope);
    expect(mocks.ensure).toHaveBeenCalledWith(
      database,
      expect.objectContaining({ movieWatchProviders: expect.any(Function) }),
      scope,
    );
  });
  it.each([{ id: 43, title: 'Wrong record' }, { id: 42, vote_average: 12 }, null])(
    'counts failed/malformed hydration separately from empty lists: %j',
    async (raw) => {
      const result = await createSystemListService(
        database,
        vi.fn().mockResolvedValue(raw),
        vi.fn(),
      ).page('owner', systemListPageInput.parse({ listType: 'watchlist' }));
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(1);
      expect(result.unavailableItems).toBe(1);
    },
  );
  it('reads both independent system-list memberships', async () => {
    const result = await createSystemListService(database, vi.fn(), vi.fn()).memberships('owner', {
      resourceId: 42,
      resourceType: 'tv',
    });
    expect(result).toEqual({ inWatchlist: true, watched: false });
    expect(mocks.store.membership).toHaveBeenCalledWith('owner', 'watched', 42, 'tv');
  });
  it('writes titles through on add, preserving successful list writes when synchronization fails', async () => {
    const fetcher = vi.fn();
    const report = vi.fn();
    const input = { listType: 'watched', resourceType: 'tv', resourceId: 42 } as const;
    const service = createSystemListService(database, fetcher, report);
    expect(await service.toggle('owner', input)).toEqual({ action: 'added' });
    expect(mocks.store.toggleSystemListRow).toHaveBeenCalledWith('owner', 'watched', 42, 'tv');
    expect(mocks.sync).toHaveBeenCalledWith(database, expect.any(Object), {
      mediaType: 'tv',
      tmdbId: 42,
    });
    const source = mocks.sync.mock.calls[0][1];
    await source.tvDetails(42);
    await source.movieDetails(7);
    await source.movieWatchProviders(7);
    await source.tvWatchProviders(42);
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual([
      '/tv/42',
      '/movie/7',
      '/movie/7/watch/providers',
      '/tv/42/watch/providers',
    ]);
    mocks.sync.mockRejectedValueOnce(new Error('upstream down'));
    expect(await service.toggle('owner', input)).toEqual({ action: 'added' });
    expect(report).toHaveBeenCalledWith(expect.any(Error), input);
  });
  it.each(['removed', 'unchanged'])(
    'never schedules title writes for %s results',
    async (action) => {
      mocks.store.toggleSystemListRow.mockResolvedValue(action);
      expect(
        await createSystemListService(database, vi.fn(), vi.fn()).toggle('owner', {
          listType: 'watchlist',
          resourceId: 42,
          resourceType: 'movie',
        }),
      ).toEqual({ action });
      expect(mocks.sync).not.toHaveBeenCalled();
    },
  );
  it('passes the list/media ownership scope to ordering and distinguishes not-found from outages', async () => {
    const service = createSystemListService(database, vi.fn(), vi.fn());
    const input = { listType: 'watchlist', resourceType: 'movie', itemId, position: 20 } as const;
    expect(await service.move('owner', input)).toEqual({ success: true });
    expect(mocks.move).toHaveBeenCalledWith('owner', input);
    mocks.move.mockRejectedValueOnce(new ListItemNotFoundError());
    await expect(service.move('other', input)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    mocks.move.mockRejectedValueOnce(new Error('database down'));
    await expect(service.move('owner', input)).rejects.toThrow('database down');
  });
  it('returns the same saved-provider choices as the web list filter', async () => {
    mocks.providers.mockResolvedValue([8]);
    const fetcher = vi.fn().mockResolvedValue({
      results: [
        { provider_id: 8, provider_name: 'Netflix', logo_path: null, display_priority: 1 },
        { provider_id: 9, provider_name: 'Other', logo_path: null, display_priority: 2 },
      ],
    });
    expect(
      await createSystemListService(database, fetcher, vi.fn()).options('owner', { region: 'NO' }),
    ).toEqual([{ id: 8, name: 'Netflix', logoUrl: null }]);
    expect(mocks.providers).toHaveBeenCalledWith('owner');
  });
  it('fails explicitly when private storage is unavailable', async () => {
    const service = createSystemListService(undefined, vi.fn(), vi.fn());
    await expect(
      service.page('owner', systemListPageInput.parse({ listType: 'watchlist' })),
    ).rejects.toThrow('DATABASE_URL');
    await expect(
      service.toggle('owner', { listType: 'watchlist', resourceId: 42, resourceType: 'movie' }),
    ).rejects.toThrow('DATABASE_URL');
    await expect(
      service.memberships('owner', { resourceId: 42, resourceType: 'movie' }),
    ).rejects.toThrow('DATABASE_URL');
    await expect(service.options('owner', { region: 'SE' })).rejects.toThrow('DATABASE_URL');
    await expect(
      service.move('owner', { listType: 'watchlist', resourceType: 'movie', itemId, position: 0 }),
    ).rejects.toThrow('DATABASE_URL');
  });
});
