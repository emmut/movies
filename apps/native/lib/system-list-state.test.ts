import type { SystemListPage } from '@movies/api/system-lists';
import { canReorderList } from '@native/lib/list-page-state';
import { readSystemListState } from '@native/lib/system-list-state';
import { describe, expect, it } from 'vite-plus/test';

describe('native system list context', () => {
  it('uses account region, validates URL bounds and does not apply saved Discover providers implicitly', () => {
    expect(
      readSystemListState(
        {
          page: '-1',
          mediaType: 'person',
          watch_region: 'XX',
          with_watch_providers: '8|0|8|2147483648',
        },
        'watched',
        'NO',
      ),
    ).toEqual({
      listType: 'watched',
      resourceType: 'movie',
      page: 1,
      region: 'NO',
      providerIds: [8],
    });
    expect(
      readSystemListState({ page: '2', mediaType: 'tv', watch_region: 'SE' }, 'watchlist', 'NO'),
    ).toMatchObject({ page: 2, resourceType: 'tv', region: 'SE', providerIds: [] });
  });
  it('permits global ordering only for a complete, fresh unfiltered view', () => {
    const input = readSystemListState({}, 'watchlist', 'SE');
    const result: SystemListPage = {
      items: [],
      currentPage: 2,
      totalPages: 2,
      itemsPerPage: 20,
      totalItems: 21,
      counts: { movie: 21, tv: 0 },
      unavailableItems: 0,
    };
    expect(canReorderList(input, result, false)).toBe(true);
    expect(canReorderList({ ...input, providerIds: [8] }, result, false)).toBe(false);
    expect(canReorderList(input, result, true)).toBe(false);
    expect(canReorderList(input, { ...result, unavailableItems: 1 }, false)).toBe(false);
    expect(canReorderList(input, { ...result, totalItems: 0 }, false)).toBe(false);
  });
});
