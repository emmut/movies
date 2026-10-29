import { CustomListNotFoundError, CustomListConflictError } from '@movies/db/custom-lists';
import { createCustomListService } from '@server/custom-list-service';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const store = vi.hoisted(() => ({
  index: vi.fn(),
  pageRows: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  status: vi.fn(),
  move: vi.fn(),
}));
const order = vi.hoisted(() => ({ move: vi.fn() }));
const sync = vi.hoisted(() => vi.fn());
vi.mock('@movies/db/custom-lists', async (original) => ({
  ...(await original<typeof import('@movies/db/custom-lists')>()),
  createCustomListStore: () => store,
}));
vi.mock('@movies/db/list-item-order', async (original) => ({
  ...(await original<typeof import('@movies/db/list-item-order')>()),
  createListItemOrderingStore: () => order,
}));
vi.mock('@movies/db/title-sync', () => ({ syncTitle: sync }));
const id = '00000000-0000-4000-8000-000000000001';
const dated = {
  id,
  name: 'Favorites',
  description: '',
  emoji: '🎬',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  itemCount: 3,
};
const rows = [
  { id, resourceId: 1, resourceType: 'movie' },
  { id: '00000000-0000-4000-8000-000000000002', resourceId: 2, resourceType: 'person' },
  { id: '00000000-0000-4000-8000-000000000003', resourceId: 3, resourceType: 'tv' },
];
const input = { listId: id, page: 1, providerIds: [], region: 'NO' as const };
function setup() {
  const fetcher = vi.fn().mockImplementation(async (path: string) => {
    const key = Number(path.split('/').at(-1));
    if (path.startsWith('/person')) {
      return { id: key, name: 'Person', profile_path: null };
    }
    return {
      id: key,
      title: 'Movie',
      name: 'Show',
      poster_path: null,
      backdrop_path: null,
      vote_average: 8,
    };
  });
  const report = vi.fn();
  return { fetcher, report, service: createCustomListService({} as never, fetcher, report) };
}
beforeEach(() => {
  vi.resetAllMocks();
  store.pageRows.mockResolvedValue({
    ...dated,
    items: rows,
    totalItems: 3,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 20,
  });
  store.index.mockResolvedValue({
    lists: [dated],
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 24,
  });
  store.status.mockResolvedValue([{ ...dated, hasItem: true }]);
});
describe('custom list host service', () => {
  it('preserves mixed manual ordering and serializes dates for RPC', async () => {
    const { service } = setup();
    const page = await service.details('owner', input);
    expect(page.items.map((item) => item.type)).toEqual(['movie', 'person', 'tv']);
    expect(page.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(page.unavailableItems).toBe(0);
    expect(store.pageRows).toHaveBeenCalledWith('owner', id, 1, null);
    expect((await service.index('owner', { page: 1 })).lists[0].updatedAt).toBe(
      '2026-01-02T00:00:00.000Z',
    );
    expect(
      (await service.status('owner', { resourceId: 2, resourceType: 'person' }))[0].hasItem,
    ).toBe(true);
  });
  it('reports missing or mismatched upstream entries without changing stored counts', async () => {
    const { service, fetcher } = setup();
    fetcher.mockImplementation(async () => ({
      id: 999,
      poster_path: null,
      backdrop_path: null,
      vote_average: 8,
    }));
    const page = await service.details('owner', input);
    expect(page).toMatchObject({ items: [], unavailableItems: 3, totalItems: 3, itemCount: 3 });
  });
  it('authorizes before hydration or provider work and maps missing lists to NOT_FOUND', async () => {
    const { service, fetcher } = setup();
    store.pageRows.mockRejectedValue(new CustomListNotFoundError());
    await expect(service.details('foreign', { ...input, providerIds: [8] })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('passes the provider/region filter to the canonical store', async () => {
    const { service } = setup();
    await service.details('owner', { ...input, providerIds: [8] });
    expect(store.pageRows).toHaveBeenCalledWith('owner', id, 1, { providerIds: [8], region: 'NO' });
  });
  it('keeps a committed title add successful when optional cache write-through fails', async () => {
    const { service, report } = setup();
    sync.mockRejectedValue(new Error('TMDB unavailable'));
    expect(
      await service.add('owner', { listId: id, resourceId: 1, resourceType: 'movie' }),
    ).toEqual({ success: true });
    expect(store.add).toHaveBeenCalledWith('owner', id, 1, 'movie');
    expect(report).toHaveBeenCalledOnce();
  });
  it('never attempts title-cache sync for a person and maps duplicate adds to CONFLICT', async () => {
    const { service } = setup();
    await service.add('owner', { listId: id, resourceId: 2, resourceType: 'person' });
    expect(sync).not.toHaveBeenCalled();
    store.add.mockRejectedValue(new CustomListConflictError());
    await expect(
      service.add('owner', { listId: id, resourceId: 1, resourceType: 'movie' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(sync).not.toHaveBeenCalled();
  });
  it('scopes item ordering to custom lists so a system item ID cannot be reused', async () => {
    const { service } = setup();
    await service.moveItem('owner', { itemId: id, position: 8 });
    expect(order.move).toHaveBeenCalledWith('owner', {
      itemId: id,
      position: 8,
      listType: 'custom',
    });
    await service.update('owner', { listId: id, name: 'New', description: 'Text', emoji: '⭐' });
    expect(store.update).toHaveBeenCalledWith('owner', id, 'New', 'Text', '⭐');
    await service.remove('owner', { listId: id, resourceId: 1, resourceType: 'tv' });
    expect(store.remove).toHaveBeenCalledWith('owner', id, 1, 'tv');
    await service.delete('owner', { listId: id });
    expect(store.delete).toHaveBeenCalledWith('owner', id);
    await service.move('owner', { listId: id, position: 3 });
    expect(store.move).toHaveBeenCalledWith('owner', id, 3);
  });
  it('does not present an unavailable database as an empty list', async () => {
    const { fetcher, report } = setup();
    const service = createCustomListService(undefined, fetcher, report);
    await expect(service.index('owner', { page: 1 })).rejects.toThrow('DATABASE_URL');
  });
});
