import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vite-plus/test';

import { ListDetailsContent } from '@/app/lists/[id]/list-details-content';

const state = vi.hoisted(() => ({
  page: 2,
  returned: 1,
  placeholder: false,
  isLoading: false,
  isFetching: false,
  isError: false,
  itemCount: 20,
  unavailable: 0,
  setParams: vi.fn(),
  effects: [] as (() => void)[],
}));
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useEffect: (effect: () => void) => state.effects.push(effect),
}));
vi.mock('nuqs', () => {
  const parser = { withDefault: () => parser };
  return {
    parseAsArrayOf: () => parser,
    parseAsInteger: parser,
    parseAsString: parser,
    useQueryStates: () => [
      { page: state.page, with_watch_providers: [], watch_region: 'SE' },
      state.setParams,
    ],
  };
});
vi.mock('@movies/api/react/use-custom-lists-query', () => ({
  useCustomListsDetails: () => ({
    data: {
      id: 'list',
      name: 'Favorites',
      description: null,
      emoji: '📝',
      createdAt: '',
      updatedAt: '',
      totalItems: 20,
      itemCount: state.itemCount,
      totalPages: 1,
      currentPage: state.returned,
      itemsPerPage: 20,
      unavailableItems: state.unavailable,
      items: [
        {
          id: 42,
          type: 'movie',
          title: 'Movie',
          releaseDate: '',
          posterUrl: null,
          backdropUrl: null,
          rating: 0,
          listItemId: 'row',
        },
      ],
    },
    isLoading: state.isLoading,
    isFetching: state.isFetching,
    isError: state.isError,
    isPlaceholderData: state.placeholder,
    refetch: vi.fn(),
  }),
  useCustomListsMoveItemMutation: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/hooks/use-reorderable-items', () => ({
  useReorderableItems: (items: unknown[], offset: number) => ({
    localItems: items,
    offset,
    isPending: false,
    move: vi.fn(),
  }),
}));
vi.mock('@/components/list-items-grid', () => ({
  ListItemsGrid: ({ offset }: { offset: number }) => <div data-offset={offset} />,
}));
vi.mock('@/components/reorder-button', () => ({
  ReorderButtonSlot: ({ isAvailable }: { isAvailable: boolean }) => (
    <button disabled={!isAvailable}>Reorder</button>
  ),
}));
vi.mock('@/components/delete-list-button', () => ({ DeleteListButton: () => null }));
vi.mock('@/components/edit-list-dialog', () => ({ EditListDialog: () => null }));
vi.mock('@/components/list-toolbar', () => ({ ListToolbar: () => null }));
vi.mock('@/components/pagination-controls', () => ({ PaginationControls: () => null }));
function render() {
  return renderToStaticMarkup(
    <ListDetailsContent listId="list" userId="owner" userRegion="SE" watchProviders={[]} />,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(state, {
    page: 2,
    returned: 1,
    placeholder: false,
    isLoading: false,
    isFetching: false,
    isError: false,
    itemCount: 20,
    unavailable: 0,
    effects: [],
  });
});
it('uses the returned page offset and disables moves until the URL is reconciled', () => {
  const html = render();
  expect(html).toContain('data-offset="0"');
  expect(html).toContain('<button disabled="">Reorder</button>');
  for (const effect of state.effects) effect();
  expect(state.setParams).toHaveBeenCalledWith({ page: 1 }, { history: 'replace' });
});
it('does not replace a pending page with the previous placeholder page', () => {
  state.placeholder = true;
  const html = render();
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain('aria-label="Loading titles"');
  expect(html).toContain('Favorites');
  expect(html).not.toContain('data-offset=');
  for (const effect of state.effects) effect();
  expect(state.setParams).not.toHaveBeenCalled();
});
it('shows placeholders instead of the previous empty state during a filter change', () => {
  state.placeholder = true;
  state.itemCount = 0;
  const html = render();
  expect(html).toContain('aria-label="Loading titles"');
  expect(html).not.toContain('This list is empty');
});
it('shows placeholders on the initial fetch', () => {
  state.isLoading = true;
  expect(render()).toContain('aria-label="Loading titles"');
});
it('keeps items visible during a background refresh', () => {
  state.isFetching = true;
  const html = render();
  expect(html).toContain('data-offset="0"');
  expect(html).not.toContain('aria-label="Loading titles"');
});
it('replaces placeholders with the requested page when it arrives', () => {
  state.placeholder = true;
  expect(render()).toContain('aria-label="Loading titles"');
  state.placeholder = false;
  state.returned = 2;
  const html = render();
  expect(html).not.toContain('aria-label="Loading titles"');
  expect(html).toContain('data-offset="20"');
});
it('shows a failed read instead of leaving the placeholders visible', () => {
  state.isError = true;
  const html = render();
  expect(html).not.toContain('aria-label="Loading titles"');
  expect(html).not.toContain('data-offset=');
  expect(html).toContain('Refresh the page to retry.');
});
it('keeps incomplete pages non-reorderable and explains the missing titles', () => {
  state.page = 1;
  state.unavailable = 1;
  const html = render();
  expect(html).toContain('<button disabled="">Reorder</button>');
  expect(html).toContain('saved title couldn’t');
});
