import { readFileSync } from 'node:fs';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ListDetailsContent } from '@/app/lists/[id]/list-details-content';
import ListDetailsLoading from '@/app/lists/[id]/loading';
import ListsLoading from '@/app/lists/loading';
import { SystemListLoading } from '@/components/system-list-loading';

const list = vi.hoisted(() => ({
  id: 'list-1',
  name: 'Weekend picks',
  description: 'Films to watch when there is time for something great.',
  emoji: '🎬',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  itemCount: 1,
  totalPages: 1,
  allItems: [],
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: list, isLoading: false, isError: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('nuqs', () => {
  const parser = { withDefault: () => parser };

  return {
    parseAsArrayOf: () => parser,
    parseAsInteger: parser,
    parseAsString: parser,
    useQueryStates: () => [{ page: 1, with_watch_providers: [], watch_region: 'SE' }, vi.fn()],
  };
});

vi.mock('@/components/delete-list-button', () => ({
  DeleteListButton: () => <button type="button">Delete List</button>,
}));
vi.mock('@/components/edit-list-dialog', () => ({
  EditListDialog: () => <button type="button">Edit List</button>,
}));
vi.mock('@/components/list-items-grid', () => ({ ListItemsGrid: () => <div /> }));
vi.mock('@/components/reorder-button', () => ({
  ReorderButtonSlot: () => <button type="button">Reorder items</button>,
}));
vi.mock('@/components/watch-provider-filter', () => ({
  default: () => <button type="button">Providers</button>,
}));
vi.mock('@/hooks/use-reorderable-items', () => ({
  useReorderableItems: () => ({ localItems: [], isPending: false, move: vi.fn() }),
}));
vi.mock('@/lib/lists', () => ({ moveListItem: vi.fn() }));

describe('list loading headers', () => {
  it('reserves every system-list header control at its loaded height', () => {
    const markup = renderToStaticMarkup(<SystemListLoading title="My Watchlist" />);

    expect(markup).toContain('data-slot="watch-provider-filter-skeleton"');
    expect(markup).toContain('data-slot="reorder-button-skeleton"');
    expect(markup).toContain('data-slot="media-type-selector-skeleton"');
    expect(markup).toContain('h-7');
    expect(markup).toContain('h-9');
  });

  it('reserves the lists reorder row before the grid', () => {
    const markup = renderToStaticMarkup(<ListsLoading />);
    const reorderPosition = markup.indexOf('data-slot="reorder-button-skeleton"');
    const gridPosition = markup.indexOf('grid grid-cols-1');

    expect(reorderPosition).toBeGreaterThan(-1);
    expect(reorderPosition).toBeLessThan(gridPosition);
  });

  it('matches the custom-list header controls and description region', () => {
    const markup = renderToStaticMarkup(<ListDetailsLoading />);

    expect(markup).toContain('data-slot="list-description-skeleton"');
    expect(markup).toContain('data-slot="watch-provider-filter-skeleton"');
    expect(markup).toContain('data-slot="reorder-button-skeleton"');
    expect(markup).toContain('data-slot="edit-list-button-skeleton"');
    expect(markup).toContain('data-slot="delete-list-button-skeleton"');
  });

  it('renders a custom list description in the loaded header', () => {
    const markup = renderToStaticMarkup(
      <ListDetailsContent
        listId={list.id}
        fetchListDetailsAction={vi.fn()}
        watchProviders={[]}
        userRegion="SE"
      />,
    );

    expect(markup).toContain(list.description);
    expect(markup).toContain('class="h-12 overflow-hidden"');
  });

  it('keeps the root scrollbar gutter stable', () => {
    const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

    expect(css).toMatch(/scrollbar-gutter:\s*stable/);
  });
});
