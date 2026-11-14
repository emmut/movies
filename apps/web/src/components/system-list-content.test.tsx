import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { SystemListContent } from './system-list-content';

const state = vi.hoisted(() => ({
  page: 2,
  currentPage: 1,
  totalPages: 1,
  providers: [] as number[],
  isError: false,
  isLoading: false,
  effects: [] as (() => void)[],
  setUrlState: vi.fn(),
  reorder: vi.fn(),
}));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useEffect: (effect: () => void) => state.effects.push(effect),
}));
vi.mock('nuqs', () => {
  const parser = { withDefault: () => parser };
  return {
    parseAsArrayOf: () => parser,
    parseAsInteger: parser,
    parseAsString: parser,
    useQueryStates: () => [
      {
        mediaType: 'movie',
        page: state.page,
        with_watch_providers: state.providers,
        watch_region: 'SE',
      },
      state.setUrlState,
    ],
  };
});
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data: queryKey.includes('counts')
      ? 20
      : {
          items: [{ listItemId: 'first-movie' }],
          currentPage: state.currentPage,
          totalPages: state.totalPages,
        },
    isLoading: state.isLoading,
    isError: state.isError,
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/hooks/use-reorderable-items', () => ({
  useReorderableItems: (items: unknown[], offset: number) => {
    state.reorder(offset);
    return { localItems: items, isPending: false, move: vi.fn() };
  },
}));
vi.mock('@/lib/lists', () => ({ moveListItem: vi.fn() }));
vi.mock('@/lib/system-list-queries', () => ({
  getSystemListCount: vi.fn(),
  getSystemListWithResourceDetailsPaginated: vi.fn(),
}));
vi.mock('@/components/list-items-grid', () => ({
  ListItemsGrid: ({ offset, editing }: { offset: number; editing: boolean }) => (
    <div data-offset={offset} data-editing={editing} />
  ),
}));
vi.mock('@/components/reorder-button', () => ({
  ReorderButtonSlot: ({ isAvailable }: { isAvailable: boolean }) => (
    <button disabled={!isAvailable}>Reorder items</button>
  ),
}));
vi.mock('@/components/media-type-selector', () => ({ default: () => null }));
vi.mock('@/components/watch-provider-filter', () => ({ default: () => null }));
vi.mock('@/components/pagination-controls', () => ({ PaginationControls: () => null }));

function renderContent() {
  return renderToStaticMarkup(
    <SystemListContent listType="watchlist" userId="user" watchProviders={[]} userRegion="SE" />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(state, {
    page: 2,
    currentPage: 1,
    totalPages: 1,
    providers: [],
    isError: false,
    isLoading: false,
    effects: [],
  });
});

describe('system-list page reconciliation', () => {
  it('uses the returned page for moves and blocks reordering until the stale URL is replaced', () => {
    const html = renderContent();
    expect(state.reorder).toHaveBeenCalledWith(0);
    expect(html).toContain('data-offset="0"');
    expect(html).toContain('data-editing="false"');
    expect(html).toMatch(/<button disabled="">Reorder items<\/button>/);
    for (const effect of state.effects) effect();
    expect(state.setUrlState).toHaveBeenCalledWith({ page: 1 }, { history: 'replace' });
  });

  it('enables reordering after the URL matches the returned first page', () => {
    state.page = 1;
    expect(renderContent()).toContain('<button>Reorder items</button>');
    expect(state.reorder).toHaveBeenCalledWith(0);
    for (const effect of state.effects) effect();
    expect(state.setUrlState).not.toHaveBeenCalled();
  });

  it('preserves the offset for a valid second page', () => {
    state.currentPage = 2;
    state.totalPages = 2;
    expect(renderContent()).toContain('<button>Reorder items</button>');
    expect(state.reorder).toHaveBeenCalledWith(20);
    for (const effect of state.effects) effect();
    expect(state.setUrlState).not.toHaveBeenCalled();
  });

  it('keeps provider-filtered lists non-reorderable', () => {
    state.page = 1;
    state.providers = [8];
    expect(renderContent()).toMatch(/<button disabled="">Reorder items<\/button>/);
  });

  it('does not reconcile a failed read using previously cached data', () => {
    state.isError = true;
    renderContent();
    for (const effect of state.effects) effect();
    expect(state.setUrlState).not.toHaveBeenCalled();
  });
});
