import type { CustomListEntry, CustomListSummary } from '@movies/api/custom-lists';
import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { textContrastRatios } from '@native/e2e/contrast';
import { mockAccountRegion, mockSession } from '@native/e2e/session-fixtures';
import { expect, test, type Page } from '@playwright/test';

function uuid(n: number) {
  return '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
}
function summary(n: number): CustomListSummary {
  return {
    id: uuid(n),
    name: 'List ' + n,
    description: 'Saved favorites',
    emoji: '🎬',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    itemCount: 0,
  };
}
function entry(n: number, type: 'movie' | 'tv' | 'person' = 'movie'): CustomListEntry {
  const common = {
    id: n,
    type,
    title: type === 'person' ? 'Performer ' + n : 'Title ' + n,
    posterUrl: null,
    listItemId: uuid(n + 1000),
  };
  if (type === 'person') {
    return { ...common, type };
  }
  return { ...common, type, backdropUrl: null, releaseDate: '2025', rating: 8 };
}
async function model(page: Page, { empty = false, many = false, long = false } = {}) {
  await mockEmptySupport({ page });
  await mockSession(page);
  await mockAccountRegion(page, 'NO');
  const data = {
    lists: empty ? [] : Array.from({ length: many ? 25 : 2 }, (_, i) => summary(i + 1)),
    entries: new Map<string, CustomListEntry[]>(),
    calls: [] as { method: string; input: Record<string, unknown> }[],
    failReads: false,
    failWrites: false,
  };
  data.entries.set(
    uuid(1),
    long
      ? Array.from({ length: 21 }, (_, i) => entry(i + 1))
      : [entry(42), entry(7, 'person'), entry(1399, 'tv')],
  );
  function count(item: CustomListSummary) {
    return { ...item, itemCount: data.entries.get(item.id)?.length ?? 0 };
  }
  const handlers: Record<string, (input: ReturnType<typeof readInput>) => unknown> = {
    index(input) {
      const totalPages = Math.ceil(data.lists.length / 24),
        currentPage = Math.min(input.page ?? 1, Math.max(1, totalPages));
      return {
        lists: data.lists.slice((currentPage - 1) * 24, currentPage * 24).map(count),
        totalItems: data.lists.length,
        totalPages,
        currentPage,
        itemsPerPage: 24,
      };
    },
    details(input) {
      const item = data.lists.find((item) => item.id === input.listId);
      if (!item) {
        throw new Error('NOT_FOUND');
      }
      const all = data.entries.get(item.id) ?? [];
      const rows = input.providerIds?.length ? all.filter((row) => row.type === 'movie') : all;
      const totalPages = Math.ceil(rows.length / 20),
        currentPage = Math.min(input.page ?? 1, Math.max(1, totalPages));
      return {
        ...count(item),
        items: rows.slice((currentPage - 1) * 20, currentPage * 20),
        totalItems: rows.length,
        totalPages,
        currentPage,
        itemsPerPage: 20,
        unavailableItems: 0,
      };
    },
    create(input) {
      const id = uuid(100 + data.lists.length);
      data.lists.push({ ...summary(100 + data.lists.length), ...input, id });
      return { success: true, listId: id };
    },
    update(input) {
      const item = data.lists.find((item) => item.id === input.listId)!;
      Object.assign(item, input);
      return { success: true };
    },
    delete(input) {
      data.lists = data.lists.filter((item) => item.id !== input.listId);
      data.entries.delete(input.listId);
      return { success: true };
    },
    move(input) {
      const [item] = data.lists.splice(
        data.lists.findIndex((item) => item.id === input.listId),
        1,
      );
      data.lists.splice(input.position, 0, item);
      return { success: true };
    },
    moveItem(input) {
      for (const items of data.entries.values()) {
        const index = items.findIndex((item) => item.listItemId === input.itemId);
        if (index >= 0) {
          const [item] = items.splice(index, 1);
          items.splice(input.position, 0, item);
          break;
        }
      }
      return { success: true };
    },
    status(input) {
      return data.lists.map((item) => ({
        ...count(item),
        hasItem: (data.entries.get(item.id) ?? []).some(
          (row) => row.id === input.resourceId && row.type === input.resourceType,
        ),
      }));
    },
    add(input) {
      const items = data.entries.get(input.listId) ?? [];
      if (!items.some((item) => item.id === input.resourceId && item.type === input.resourceType)) {
        items.push(entry(input.resourceId, input.resourceType));
      }
      data.entries.set(input.listId, items);
      return { success: true };
    },
    remove(input) {
      data.entries.set(
        input.listId,
        (data.entries.get(input.listId) ?? []).filter(
          (item) => item.id !== input.resourceId || item.type !== input.resourceType,
        ),
      );
      return { success: true };
    },
  };
  await page.route('**/rpc/customLists/*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const method = new URL(route.request().url()).pathname.split('/').at(-1)!;
    const input = readInput(route.request());
    data.calls.push({ method, input });
    let status = 200,
      result: unknown;
    try {
      if (data.failReads && ['index', 'details', 'status'].includes(method)) {
        throw new Error('INTERNAL_SERVER_ERROR');
      }
      if (data.failWrites && !['index', 'details', 'status'].includes(method)) {
        throw new Error('INTERNAL_SERVER_ERROR');
      }
      result = handlers[method](input);
    } catch (error) {
      const code = (error as Error).message;
      status = code === 'NOT_FOUND' ? 404 : 500;
      result = { defined: false, code, status, message: code };
    }
    await route.fulfill({ status, json: { json: result }, headers: corsHeaders });
  });
  await page.route('**/rpc/systemLists/options*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: { json: [{ id: 8, name: 'Netflix', logoUrl: null }] },
      headers: corsHeaders,
    });
  });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    await route.fulfill({
      json: { json: { ...detailFixture(input.type), id: input.id } },
      headers: corsHeaders,
    });
  });
  await page.route('**/rpc/person/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: {
        json: {
          id: 7,
          name: 'Performer 7',
          biography: 'A performer biography.',
          profileUrl: null,
          birthday: null,
          deathday: null,
          birthplace: null,
          department: 'Acting',
          aliases: [],
          popularity: 8,
          homepage: null,
          imdbUrl: null,
        },
      },
      headers: corsHeaders,
    });
  });
  await page.route('**/rpc/person/credits*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: [] }, headers: corsHeaders });
  });
  return data;
}

test('Lists stays native and supports validated create, edit, cancel and confirmed delete', async ({
  page,
}) => {
  const data = await model(page, { empty: true });
  await page.goto('/more');
  await page.getByRole('link', { name: 'Lists', exact: true }).click();
  await expect(page.getByText('You haven’t created any lists yet')).toBeVisible();
  await page.getByRole('button', { name: 'Create New List', exact: true }).click();
  await page.getByRole('button', { name: 'Create List', exact: true }).click();
  await expect(page.getByText('List name is required')).toBeVisible();
  await page.getByRole('textbox', { name: 'List name', exact: true }).fill(' Favorites ');
  await page.getByRole('textbox', { name: 'List description' }).fill('For the weekend');
  await page.getByRole('radio', { name: 'Emoji ⭐', exact: true }).click();
  await page.getByRole('button', { name: 'Create List', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open list Favorites', exact: true })).toBeVisible();
  expect(data.lists[0]).toMatchObject({
    name: 'Favorites',
    emoji: '⭐',
    description: 'For the weekend',
  });
  await page.getByRole('button', { name: 'Edit Favorites', exact: true }).click();
  await page.getByRole('textbox', { name: 'List name', exact: true }).fill('Weekend');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Weekend', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(data.lists).toHaveLength(1);
  await page.getByRole('button', { name: 'Delete Weekend', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm Delete List', exact: true }).click();
  await expect(page.getByText('You haven’t created any lists yet')).toBeVisible();
  expect(data.lists).toHaveLength(0);
  expect(page.context().pages()).toHaveLength(1);
});
test('index reconciles a clamped page before moving across page boundaries', async ({ page }) => {
  const data = await model(page, { many: true });
  await page.goto('/more/lists?page=999');
  await expect(page).toHaveURL(/page=2$/);
  await page.getByRole('button', { name: 'Reorder lists', exact: true }).click();
  await page.getByRole('button', { name: 'Move List 25 up', exact: true }).click();
  await expect
    .poll(() => data.calls.filter((call) => call.method === 'move').at(-1)?.input)
    .toEqual({ listId: uuid(25), position: 23 });
  await expect(page.getByRole('link', { name: 'Open list List 24', exact: true })).toBeVisible();
});
test('mixed titles and people retain More navigation and explicit watch region', async ({
  page,
}) => {
  const data = await model(page);
  await page.goto('/more/lists/' + uuid(1) + '?watch_region=US');
  await page.getByRole('link', { name: 'Open Title 42, Movie', exact: true }).click();
  await expect(page).toHaveURL(/\/more\/movie\/42\?region=US$/);
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  await page.goBack();
  await page.getByRole('link', { name: 'Open Performer 7, Person', exact: true }).click();
  await expect(page).toHaveURL(/\/more\/person\/7\?region=US$/);
  await expect(page.getByText('A performer biography.')).toBeAttached();
  await page.goBack();
  await page.getByRole('button', { name: 'Remove Title 1399 from list', exact: true }).click();
  await expect.poll(() => data.entries.get(uuid(1))?.length).toBe(2);
  await expect(page.getByText('2 items', { exact: true })).toBeVisible();
});
test('details preserve OR provider filters, disable filtered reordering and retain region', async ({
  page,
}) => {
  const data = await model(page);
  await page.goto('/more/lists/' + uuid(1));
  await page.getByRole('button', { name: 'Providers', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Netflix', exact: true }).click();
  await page.getByRole('button', { name: 'Close Providers' }).click();
  await expect(page.getByRole('button', { name: 'Reorder', exact: true })).toBeDisabled();
  await expect
    .poll(() => data.calls.filter((call) => call.method === 'details').at(-1)?.input)
    .toMatchObject({ providerIds: [8], region: 'NO', page: 1 });
  await expect(
    page.getByRole('link', { name: 'Open Performer 7, Person', exact: true }),
  ).not.toBeAttached();
  await page.getByRole('button', { name: 'Watch region', exact: true }).click();
  await page.getByRole('radio', { name: 'United States', exact: true }).click();
  await expect
    .poll(() => data.calls.filter((call) => call.method === 'details').at(-1)?.input)
    .toMatchObject({ region: 'US', providerIds: [8] });
});
test('removing the final item on the final page reconciles pagination and preserves ordering', async ({
  page,
}) => {
  await model(page, { long: true });
  await page.goto('/more/lists/' + uuid(1) + '?page=2');
  await page.getByRole('button', { name: 'Remove Title 21 from list', exact: true }).click();
  await expect(page).toHaveURL(/page=1$/);
  await expect(page.getByText('20 items', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reorder', exact: true }).click();
  await page.getByRole('button', { name: 'Move Title 2 up', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open Title 2, Movie', exact: true })).toBeAttached();
});
for (const type of ['movie', 'tv', 'person'] as const) {
  test(`save-to-list picker toggles ${type} membership and creates a new list`, async ({
    page,
  }) => {
    const data = await model(page);
    await page.goto(type === 'person' ? '/person/7' : '/' + type + '/42');
    await page.getByRole('button', { name: 'Add to Lists', exact: true }).click();
    const choice = page.getByRole('checkbox', { name: 'List 2', exact: true });
    await choice.click();
    await expect(choice).toBeChecked();
    await choice.click();
    await expect(choice).not.toBeChecked();
    await page.getByRole('button', { name: 'Create New List', exact: true }).click();
    await page.getByRole('textbox', { name: 'List name', exact: true }).fill('New favorites');
    await page.getByRole('button', { name: 'Create List', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: 'New favorites', exact: true })).toBeChecked();
    expect(data.entries.get(data.lists.at(-1)!.id)?.[0].type).toBe(type);
    await page.getByRole('button', { name: 'Close Add to Lists' }).click();
  });
}
test('read and save failures remain recoverable without losing the editor draft', async ({
  page,
}) => {
  const data = await model(page);
  data.failReads = true;
  await page.goto('/more/lists');
  await expect(page.getByText('Couldn’t load your lists.')).toBeVisible();
  data.failReads = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.getByRole('button', { name: 'Create New List', exact: true }).click();
  await page.getByRole('textbox', { name: 'List name', exact: true }).fill('Keep my draft');
  data.failWrites = true;
  await page.getByRole('button', { name: 'Create List', exact: true }).click();
  await expect(page.getByText('Couldn’t save your list. Please try again.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'List name', exact: true })).toHaveValue(
    'Keep my draft',
  );
  data.failWrites = false;
  await page.getByRole('button', { name: 'Create List', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Open list Keep my draft', exact: true }),
  ).toBeVisible();
});
test('missing and malformed lists have a usable return action', async ({ page }) => {
  await model(page);
  for (const id of ['invalid', uuid(999)]) {
    await page.goto('/more/lists/' + id);
    await expect(page.getByRole('heading', { name: 'List not found', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Back to My Lists' }).click();
    await expect(page.getByRole('button', { name: 'Create New List', exact: true })).toBeVisible();
  }
});
test('poster quick add dismisses its first sheet before showing custom lists', async ({ page }) => {
  await model(page);
  await page.goto('/more/lists/' + uuid(1));
  await page.getByRole('button', { name: 'Quick add Title 42', exact: true }).click();
  await page.getByRole('button', { name: 'Add to Lists', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Close quick add' })).not.toBeAttached();
  const choice = page.getByRole('checkbox', { name: 'List 2', exact: true });
  await choice.click();
  await expect(choice).toBeChecked();
  await page.getByRole('button', { name: 'Close Add to Lists' }).click();
  await expect(page.getByRole('link', { name: 'Open Title 42, Movie', exact: true })).toBeVisible();
});
test('pending create blocks duplicate submissions and dismissal', async ({ page }) => {
  await model(page, { empty: true });
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/rpc/customLists/create*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await gate;
    await route.fallback();
  });
  await page.goto('/more/lists');
  await page.getByRole('button', { name: 'Create New List', exact: true }).click();
  await page.getByRole('textbox', { name: 'List name', exact: true }).fill('One request');
  await page.getByRole('button', { name: 'Create List', exact: true }).click();
  try {
    await expect(page.getByRole('button', { name: 'Saving…', exact: true })).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Cancel Create New List', exact: true }),
    ).toBeDisabled();
  } finally {
    release();
  }
  await expect(
    page.getByRole('link', { name: 'Open list One request', exact: true }),
  ).toBeVisible();
});
for (const colorScheme of ['light', 'dark'] as const) {
  test(`list cards and editor match product styling in ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await model(page);
    await page.goto('/more/lists');
    const card = page.getByRole('link', { name: 'Open list List 1', exact: true });
    await expect(card).toBeVisible();
    for (const ratio of await textContrastRatios(page.getByTestId('custom-list-card-' + uuid(1)))) {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
    await page.screenshot({ path: `/tmp/pr350-native-custom-lists-${colorScheme}.png` });
    await page.getByRole('button', { name: 'Create New List', exact: true }).click();
    await page.getByRole('textbox', { name: 'List name', exact: true }).fill('Weekend favorites');
    const submit = page.getByRole('button', { name: 'Create List', exact: true });
    for (const ratio of await textContrastRatios(submit)) {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
    await page.screenshot({ path: `/tmp/pr350-native-custom-list-form-${colorScheme}.png` });
  });
}
