import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { mockAccountRegion, mockSession, sessionResponse } from '@native/e2e/session-fixtures';
import { expect, test, type Page } from '@playwright/test';

type Item = {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  releaseDate: string;
  posterUrl: null;
  backdropUrl: null;
  rating: number;
  listItemId: string;
};
function entry(id: number, type: 'movie' | 'tv' = 'movie'): Item {
  return {
    id,
    type,
    title: (type === 'movie' ? 'Movie ' : 'Series ') + id,
    releaseDate: '2024-01-01',
    posterUrl: null,
    backdropUrl: null,
    rating: 8,
    listItemId:
      '00000000-0000-4000-8000-' + String(id + (type === 'tv' ? 1000 : 0)).padStart(12, '0'),
  };
}
async function model(
  page: Page,
  settings: { empty?: boolean; failReads?: boolean; failWrites?: boolean } = {},
) {
  await mockEmptySupport({ page });
  await mockSession(page);
  await mockAccountRegion(page, 'NO');
  const data = {
    watchlist: settings.empty
      ? []
      : [...Array.from({ length: 21 }, (_, i) => entry(i + 1)), entry(1, 'tv')],
    watched: [] as Item[],
    reads: [] as Record<string, unknown>[],
    moves: [] as Record<string, unknown>[],
  };
  type Input = ReturnType<typeof readInput>;
  function listKey(input: Input) {
    return input.listType === 'watched' ? 'watched' : 'watchlist';
  }
  function fail(method: string) {
    if (method === 'page') {
      return Boolean(settings.failReads);
    }
    return Boolean(settings.failWrites) && ['toggle', 'move'].includes(method);
  }
  function currentPage(page: number | undefined, total: number) {
    return Math.max(1, Math.min(page ?? 1, Math.max(1, total)));
  }
  const handlers: Record<string, (input: Input) => unknown> = {
    options() {
      return [{ id: 8, name: 'Netflix', logoUrl: null }];
    },
    memberships(input) {
      function has(items: Item[]) {
        return items.some(
          (item) => item.id === input.resourceId && item.type === input.resourceType,
        );
      }
      return { inWatchlist: has(data.watchlist), watched: has(data.watched) };
    },
    toggle(input) {
      const key = listKey(input);
      const index = data[key].findIndex(
        (item) => item.id === input.resourceId && item.type === input.resourceType,
      );
      if (index >= 0) {
        data[key].splice(index, 1);
        return { action: 'removed' };
      }
      data[key].push(entry(input.resourceId, input.resourceType));
      return { action: 'added' };
    },
    move(input) {
      const key = listKey(input);
      data.moves.push(input);
      const matching = data[key].filter((item) => item.type === input.resourceType);
      const [moved] = matching.splice(
        matching.findIndex((item) => item.listItemId === input.itemId),
        1,
      );
      matching.splice(input.position, 0, moved);
      data[key] = [...matching, ...data[key].filter((item) => item.type !== input.resourceType)];
      return { success: true };
    },
    page(input) {
      const key = listKey(input);
      data.reads.push(input);
      let matching = data[key].filter((item) => item.type === input.resourceType);
      const providerIds = input.providerIds ?? [];
      if (providerIds.length > 0) {
        matching = matching.filter((item) => item.id === 21);
      }
      const totalPages = Math.ceil(matching.length / 20);
      const page = currentPage(input.page, totalPages);
      return {
        items: matching.slice((page - 1) * 20, page * 20),
        totalItems: matching.length,
        totalPages,
        currentPage: page,
        itemsPerPage: 20,
        counts: {
          movie: data[key].filter((item) => item.type === 'movie').length,
          tv: data[key].filter((item) => item.type === 'tv').length,
        },
        unavailableItems: 0,
      };
    },
  };
  await page.route('**/rpc/systemLists/*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    const method = new URL(route.request().url()).pathname.split('/').at(-1) ?? '';
    if (fail(method)) {
      await route.fulfill({
        status: 500,
        json: {
          json: { defined: false, code: 'INTERNAL_SERVER_ERROR', status: 500, message: 'offline' },
        },
        headers: corsHeaders,
      });
      return;
    }
    const handler = handlers[method];
    if (!handler) {
      throw new Error('Unexpected list procedure: ' + method);
    }
    await route.fulfill({ json: { json: handler(input) }, headers: corsHeaders });
  });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    await route.fulfill({
      json: { json: { ...detailFixture(input.type), id: input.id, title: 'Movie ' + input.id } },
      headers: corsHeaders,
    });
  });
  return data;
}

test('More opens native lists with movie/TV counts, paging and detail/back context', async ({
  page,
}) => {
  const data = await model(page);
  await page.goto('/more');
  await page.getByRole('link', { name: 'Watchlist', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My Watchlist', exact: true })).toBeVisible();
  await expect(page.getByText('21 movies saved · Total: 22 items')).toBeVisible();
  await page.getByRole('button', { name: 'TV Shows', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Open Series 1, TV Show', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Movies', exact: true }).click();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await page.getByRole('link', { name: 'Open Movie 21, Movie', exact: true }).click();
  await expect(page).toHaveURL(/\/more\/movie\/21\?region=NO$/);
  await expect(page.getByText('A memorable story.', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  expect(data.reads.at(-1)).toMatchObject({ page: 2, resourceType: 'movie', region: 'NO' });
  expect(page.context().pages()).toHaveLength(1);
});
test('provider filters reset pages and disable reorder while preserving total counts', async ({
  page,
}) => {
  const data = await model(page);
  await page.goto('/more/watchlist?page=2');
  await page.getByRole('button', { name: 'Providers', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Netflix', exact: true }).click();
  await page.getByRole('button', { name: 'Close Providers', exact: true }).click();
  await expect(page.getByText('Page 1 of 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reorder', exact: true })).toBeDisabled();
  expect(data.reads.at(-1)).toMatchObject({ providerIds: [8], page: 1 });
  await page.getByRole('button', { name: 'Clear providers', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reorder', exact: true })).toBeEnabled();
});
test('manual moves use media-scoped global offsets across pages', async ({ page }) => {
  const data = await model(page);
  await page.goto('/more/watchlist?page=2');
  await page.getByRole('button', { name: 'Reorder', exact: true }).click();
  await page.getByRole('button', { name: 'Move Movie 21 up', exact: true }).click();
  await expect
    .poll(() => data.moves)
    .toEqual([
      { listType: 'watchlist', resourceType: 'movie', itemId: entry(21).listItemId, position: 19 },
    ]);
  await expect(page.getByRole('link', { name: 'Open Movie 20, Movie', exact: true })).toBeVisible();
  expect(data.watchlist.filter((item) => item.type === 'tv')).toHaveLength(1);
});

test('paging is disabled while a new media input shows the previous result', async ({ page }) => {
  const data = await model(page);
  data.watchlist.push(...Array.from({ length: 40 }, (_, i) => entry(i + 22)));
  const tv = Array.from({ length: 41 }, (_, i) => entry(i + 1, 'tv'));
  let finish = () => {};
  const gate = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route('**/rpc/systemLists/page*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    if (input.resourceType !== 'tv') {
      await route.fallback();
      return;
    }
    data.reads.push(input);
    await gate;
    await route.fulfill({
      json: {
        json: {
          items: tv.slice((input.page - 1) * 20, input.page * 20),
          totalItems: 41,
          totalPages: 3,
          currentPage: input.page,
          itemsPerPage: 20,
          counts: { movie: 61, tv: 41 },
          unavailableItems: 0,
        },
      },
      headers: corsHeaders,
    });
  });
  try {
    await page.goto('/more/watchlist?page=2');
    await expect(page.getByText('Page 2 of 4')).toBeVisible();
    await page.getByRole('button', { name: 'TV Shows', exact: true }).click();
    await expect.poll(() => data.reads.at(-1)?.resourceType).toBe('tv');
    await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Previous page', exact: true })).toBeDisabled();
    finish();
    await expect(page.getByText('Page 1 of 3')).toBeVisible();
    await page.getByRole('button', { name: 'Next page', exact: true }).click();
    await expect(page.getByText('Page 2 of 3')).toBeVisible();
    expect(
      data.reads.filter((input) => input.resourceType === 'tv').map((input) => input.page),
    ).toEqual([1, 2]);
  } finally {
    finish();
  }
});

test('changing list pages starts at the top and back from a title retains that page position', async ({
  page,
}) => {
  await model(page);
  await page.goto('/more/watchlist');
  const scroll = page.getByTestId('system-list-scroll');
  await expect(page.getByText('Page 1 of 2')).toBeAttached();
  await scroll.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(100);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0);
  await page.getByRole('link', { name: 'Open Movie 21, Movie', exact: true }).click();
  await expect(page.getByText('A memorable story.', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0);
});
test('quick add updates independent watch/watched state without detail or web navigation', async ({
  page,
}) => {
  const data = await model(page);
  await page.goto('/more/watchlist?page=2');
  await page.getByRole('button', { name: 'Quick add Movie 21', exact: true }).click();
  await expect(page).toHaveURL(/\/more\/watchlist\?page=2$/);
  await page.getByRole('button', { name: 'Mark as Watched', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Mark as not watched', exact: true }),
  ).toBeVisible();
  expect(data.watched).toHaveLength(1);
  expect(data.watchlist.some((item) => item.id === 21)).toBe(true);
  await page.getByRole('button', { name: 'Remove from Watchlist', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Close quick add', exact: true }),
  ).not.toBeAttached();
  await expect(page.getByText('Page 1 of 1')).toBeVisible();
  expect(page.context().pages()).toHaveLength(1);
});
test('read outages show retry and failed toggles retain the previous membership', async ({
  page,
}) => {
  const settings = { failReads: true, failWrites: true };
  await model(page, settings);
  await page.goto('/more/watchlist?page=2');
  await expect(page.getByText('Couldn’t load your list.')).toBeVisible();
  await expect(page.getByText('Your watchlist is empty')).not.toBeAttached();
  settings.failReads = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.getByRole('button', { name: 'Quick add Movie 21', exact: true }).click();
  await page.getByRole('button', { name: 'Remove from Watchlist', exact: true }).click();
  await expect(page.getByText('Couldn’t update your list. Please try again.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Remove from Watchlist', exact: true }),
  ).toBeVisible();
});
for (const theme of ['light', 'dark'] as const) {
  test(`lists preserve web copy and empty actions in ${theme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await model(page, { empty: true });
    await page.goto('/more/watchlist');
    await expect(page.getByRole('heading', { name: 'Your watchlist is empty' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore Movies', exact: true })).toBeVisible();
    await page.screenshot({ path: `/tmp/native-system-watchlist-${theme}.png` });
    await page.goto('/more/watched');
    await expect(
      page.getByRole('heading', { name: "You haven't watched anything yet" }),
    ).toBeVisible();
  });
}
test('signed-out list routes return to native sign-in with the intended destination', async ({
  page,
}) => {
  await mockEmptySupport({ page });
  await mockSession(page, () => false);
  await page.goto('/more/watchlist?page=2&watch_region=US&with_watch_providers=8');
  await expect(page).toHaveURL(/\/login\?redirect_url=/);
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('redirect_url')).toBe(
    '/more/watchlist?page=2&watch_region=US&with_watch_providers=8',
  );
  expect(page.context().pages()).toHaveLength(1);
});

test('quick-add sign-in dismisses its sheet before exposing login controls', async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/home/*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: [entry(42)] }, headers: corsHeaders });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Quick add Movie 42', exact: true }).first().click();
  await page.getByRole('link', { name: 'Sign in to manage your lists', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close quick add' })).not.toBeAttached();
  await page
    .getByRole('button', { name: 'Continue as anonymous', exact: true })
    .click({ trial: true });
});

test('inline list sign-in preserves the explicit title country through authentication', async ({
  page,
}) => {
  await model(page);
  let signedIn = false;
  await mockSession(page, () => signedIn);
  await page.route('**/api/auth/sign-in/anonymous', async (route) => {
    if (await preflight(route)) {
      return;
    }
    signedIn = true;
    await route.fulfill({ json: sessionResponse(), headers: corsHeaders });
  });
  const regions: string[] = [];
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    regions.push(readInput(route.request()).region);
    await route.fulfill({ json: { json: detailFixture('movie') }, headers: corsHeaders });
  });
  await page.goto('/discover/movie/42?region=US');
  await page.getByRole('link', { name: 'Sign in to manage your lists', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?/);
  expect(new URL(page.url()).searchParams.get('redirect_url')).toBe('/discover/movie/42?region=US');
  await page.getByRole('button', { name: 'Continue as anonymous', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:8083/discover/movie/42?region=US');
  await expect(page.getByRole('button', { name: 'Add to Watchlist', exact: true })).toBeVisible();
  expect(regions.length).toBeGreaterThan(0);
  expect(regions.every((region) => region === 'US')).toBe(true);
});
