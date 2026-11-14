import { QueryClient, QueryClientProvider, dehydrate, hydrate } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

import { accountQueryKey } from '../account-query-key';
import { createApiQueryUtils } from '../query-utils';
import type { AppRouterClient } from '../router';
import { ApiProvider } from './provider';
import { useCustomListsDetails, useCustomListsCreateMutation } from './use-custom-lists-query';
import { useSearchList } from './use-search-query';

const searchInput = { query: 'alien', type: 'all' as const, page: 1 };
const listInput = {
  listId: 'c79df4ce-5930-41bc-9d5a-87670d175a4e',
  page: 1,
  providerIds: [],
  region: 'SE' as const,
};

function fixture() {
  const search = vi.fn().mockResolvedValue({
    items: [
      {
        id: 42,
        type: 'movie',
        title: 'Alien',
        releaseDate: '1979',
        posterUrl: null,
        backdropUrl: null,
        rating: 8,
      },
    ],
    totalPages: 1,
  });
  const create = vi.fn().mockResolvedValue({ success: true, listId: listInput.listId });
  const client = {
    search: { list: search },
    customLists: { details: vi.fn(), create },
  } as unknown as AppRouterClient;
  return { api: createApiQueryUtils(client), search, create };
}
function Search() {
  const query = useSearchList(searchInput);
  return (
    <span>{query.data?.items[0]?.type === 'movie' ? query.data.items[0].title : 'loading'}</span>
  );
}
function Details() {
  const query = useCustomListsDetails('alice', listInput);
  return <span>{query.data?.name ?? 'no private data'}</span>;
}

describe('shared React Query boundary', () => {
  it('hydrates server-prefetched public data into the same hook without a second request', async () => {
    const { api, search } = fixture();
    const server = new QueryClient();
    await server.prefetchQuery(api.search.list.queryOptions({ input: searchInput }));
    const browser = new QueryClient();
    hydrate(browser, dehydrate(server));
    const html = renderToStaticMarkup(
      <QueryClientProvider client={browser}>
        <ApiProvider api={api}>
          <Search />
        </ApiProvider>
      </QueryClientProvider>,
    );
    expect(html).toContain('Alien');
    expect(search).toHaveBeenCalledTimes(1);
    server.clear();
    browser.clear();
  });

  it.each(['bob', null])(
    'never renders Alice’s cached private data in the managed %s session',
    (accountId) => {
      const { api } = fixture();
      const client = new QueryClient();
      client.setQueryData(
        accountQueryKey(api.customLists.details.queryKey({ input: listInput }), 'alice'),
        { name: 'Alice private list' },
      );
      const html = renderToStaticMarkup(
        <QueryClientProvider client={client}>
          <ApiProvider api={api} accountId={accountId}>
            <Details />
          </ApiProvider>
        </QueryClientProvider>,
      );
      expect(html).toContain('no private data');
      expect(html).not.toContain('Alice private list');
      client.clear();
    },
  );

  it('supports native callers whose session scope is supplied to the hook', () => {
    const { api } = fixture();
    const client = new QueryClient();
    client.setQueryData(
      accountQueryKey(api.customLists.details.queryKey({ input: listInput }), 'alice'),
      { name: 'Alice private list' },
    );
    const html = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <ApiProvider api={api}>
          <Details />
        </ApiProvider>
      </QueryClientProvider>,
    );
    expect(html).toContain('Alice private list');
    client.clear();
  });

  it('a late mutation invalidates the submitting account rather than a replacement session', async () => {
    const { api, create } = fixture();
    let release!: () => void;
    create.mockImplementation(async () => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return { success: true, listId: listInput.listId };
    });
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const captureMutation =
      vi.fn<(mutation: ReturnType<typeof useCustomListsCreateMutation>) => void>();
    function Form() {
      captureMutation(useCustomListsCreateMutation());
      return null;
    }
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <ApiProvider api={api} accountId="alice">
          <Form />
        </ApiProvider>
      </QueryClientProvider>,
    );
    const mutation = captureMutation.mock.lastCall![0];
    const pending = mutation.mutateAsync({ name: 'My list', description: '', emoji: '📝' });
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <ApiProvider api={api} accountId="bob">
          <Form />
        </ApiProvider>
      </QueryClientProvider>,
    );
    release();
    await pending;
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['account', 'alice'] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['account', 'bob'] });
    client.clear();
  });
});
