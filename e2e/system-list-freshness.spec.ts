import { expect as playwrightExpect, test, type Page } from '@playwright/test';
import { Client } from 'pg';
import { z } from 'zod';

import { signInAnonymously } from './helpers';

const nativeUrl = process.env.SYSTEM_LIST_TEST_NATIVE_URL;
const apiUrl = process.env.SYSTEM_LIST_TEST_API_URL;
const databaseUrl = process.env.SYSTEM_LIST_TEST_DATABASE_URL;
const expect = playwrightExpect.configure({ timeout: 20_000 });
test.skip(
  !nativeUrl || !apiUrl || !databaseUrl,
  'Set local native and database URLs for cross-client list verification',
);

function requireLocal(url: string | undefined, label: string) {
  if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) {
    throw new Error('System-list integration requires a local ' + label);
  }
  return url;
}

async function returnToWeb(page: Page) {
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
}

async function webOrder(page: Page) {
  return page.locator('#content h3').allTextContents();
}

async function assertWriteThrough(
  database: Client,
  id: number,
  checkpoint: string,
  mediaType: 'movie' | 'tv',
) {
  const result = await database.query<{
    details_fresh: boolean;
    availability_fresh: boolean;
  }>(
    `SELECT t.fetched_at >= $2::timestamp AS details_fresh,
            s.synced_at >= $2::timestamp AS availability_fresh
     FROM titles t JOIN title_availability_syncs s USING (media_type, tmdb_id)
     WHERE t.media_type = $3 AND t.tmdb_id = $1`,
    [id, checkpoint, mediaType],
  );
  expect(result.rows).toEqual([{ details_fresh: true, availability_fresh: true }]);
}

for (const listType of ['watchlist', 'watched'] as const) {
  test(
    'native ' + listType + ' changes refresh web rows, counts, order and provider filters',
    async ({ page, context, baseURL }) => {
      test.setTimeout(180_000);
      requireLocal(baseURL, 'web app');
      const nativeBase = requireLocal(nativeUrl, 'native browser export');
      const apiBase = requireLocal(apiUrl, 'API');
      const health = await page.request.get(apiBase + '/health', { timeout: 5_000 });
      expect(health.status()).toBe(200);
      const database = new Client({ connectionString: requireLocal(databaseUrl, 'database') });
      await database.connect();
      let fixtureUserId: string | null = null;
      const native = await context.newPage();
      await native.route('**/rpc/systemLists/*', async (route) => {
        expect(new URL(route.request().url()).origin).toBe(new URL(apiBase).origin);
        await route.continue();
      });
      await native.setViewportSize({ width: 390, height: 844 });
      await page.setViewportSize({ width: 390, height: 844 });
      await native.emulateMedia({ colorScheme: 'dark' });
      await page.emulateMedia({ colorScheme: 'dark' });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      native.on('pageerror', (error) => errors.push(error.message));
      const add = listType === 'watchlist' ? 'Add to Watchlist' : 'Mark as Watched';
      const remove = listType === 'watchlist' ? 'Remove from Watchlist' : 'Mark as not watched';
      try {
        await signInAnonymously(page, '/' + listType);
        const session = await page.request.get('/api/auth/get-session');
        const created = z
          .object({ user: z.object({ id: z.string(), isAnonymous: z.literal(true) }) })
          .parse(await session.json());
        fixtureUserId = created.user.id;
        await test.info().attach('anonymous-fixture', {
          body: JSON.stringify({ userId: fixtureUserId }),
          contentType: 'application/json',
        });
        await expect(
          page.getByRole('heading', {
            name:
              listType === 'watchlist'
                ? 'Your watchlist is empty'
                : "You haven't watched anything yet",
          }),
        ).toBeVisible();
        const resources = [
          { id: 157336, type: 'movie' },
          { id: 27205, type: 'movie' },
          { id: 1399, type: 'tv' },
        ] as const;
        for (const { id, type } of resources) {
          const checkpoint = await database.query<{ time: string }>(
            'SELECT clock_timestamp()::timestamp::text AS time',
          );
          await native.goto(nativeBase + '/' + type + '/' + id);
          await native.getByRole('button', { name: add, exact: true }).click();
          await expect(native.getByRole('button', { name: remove, exact: true })).toBeEnabled();
          // Check immediately after adding, before a provider-filter read can catch up missing cache rows.
          await assertWriteThrough(database, id, checkpoint.rows[0].time, type);
        }
        await native.goto(nativeBase + '/more/' + listType);
        await expect(native.getByText(/2 movies .*Total: 3 items/)).toBeVisible();
        await returnToWeb(page);
        await expect.poll(() => webOrder(page)).toEqual(['Interstellar', 'Inception']);
        await expect(page.getByText(/2 movies .*Total: 3 items/)).toBeVisible();
        await native.getByRole('button', { name: 'TV Shows', exact: true }).click();
        await expect(
          native.getByRole('link', { name: 'Open Game of Thrones, TV Show', exact: true }),
        ).toBeVisible();
        await page.getByRole('button', { name: 'TV Shows', exact: true }).click();
        await expect.poll(() => webOrder(page)).toEqual(['Game of Thrones']);
        await native.getByRole('button', { name: 'Movies', exact: true }).click();
        await page.getByRole('button', { name: 'Movies', exact: true }).click();

        await native.getByRole('button', { name: 'Reorder', exact: true }).click();
        await native.getByRole('button', { name: 'Move Interstellar down', exact: true }).click();
        await expect
          .poll(() =>
            native
              .getByRole('link', { name: /^Open (Interstellar|Inception), Movie$/ })
              .evaluateAll((links) => links.map((link) => link.getAttribute('aria-label'))),
          )
          .toEqual(['Open Inception, Movie', 'Open Interstellar, Movie']);
        await returnToWeb(page);
        await expect.poll(() => webOrder(page)).toEqual(['Inception', 'Interstellar']);
        await native.screenshot({ path: '/tmp/native-list-live-' + listType + '.png' });
        await page.screenshot({ path: '/tmp/web-list-live-' + listType + '.png' });

        const offer = await database.query<{ provider_id: number; region: string }>(
          `SELECT provider_id, region FROM title_availability
         WHERE media_type='movie' AND tmdb_id=157336 AND region='SE' AND offer_type IN ('flatrate','free')
         ORDER BY provider_id LIMIT 1`,
        );
        expect(offer.rows).toHaveLength(1);
        const filter = '?watch_region=SE&with_watch_providers=' + offer.rows[0].provider_id;
        await native.goto(nativeBase + '/more/' + listType + filter);
        await page.goto('/' + listType + filter);
        await expect(
          native.getByRole('link', { name: 'Open Interstellar, Movie', exact: true }),
        ).toBeVisible();
        await expect.poll(() => webOrder(page)).toContain('Interstellar');
        await native.getByRole('button', { name: 'Quick add Interstellar', exact: true }).click();
        await native.getByRole('button', { name: remove, exact: true }).click();
        await expect(
          native.getByRole('link', { name: 'Open Interstellar, Movie', exact: true }),
        ).not.toBeAttached();
        await returnToWeb(page);
        await expect.poll(() => webOrder(page)).not.toContain('Interstellar');
        await expect(page.getByText(/1 movie .*Total: 2 items/)).toBeVisible();
        await page.goto('/' + listType);
        await expect.poll(() => webOrder(page)).toEqual(['Inception']);
        await native.goto(nativeBase + '/more/' + listType);
        await expect(
          native.getByRole('link', { name: 'Open Inception, Movie', exact: true }),
        ).toBeVisible();
        const otherList = listType === 'watchlist' ? 'watched' : 'watchlist';
        const emptyOtherList =
          otherList === 'watchlist'
            ? 'Your watchlist is empty'
            : "You haven't watched anything yet";
        await native.goto(nativeBase + '/more/' + otherList);
        await page.goto('/' + otherList);
        await expect(
          native.getByRole('heading', { name: emptyOtherList, exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole('heading', { name: emptyOtherList, exact: true }),
        ).toBeVisible();
        expect(errors).toEqual([]);
      } finally {
        await native.close();
        try {
          if (fixtureUserId) {
            const deleted = await database.query(
              'DELETE FROM "user" WHERE id=$1 AND is_anonymous=true',
              [fixtureUserId],
            );
            expect(deleted.rowCount).toBe(1);
          }
        } finally {
          await database.end();
        }
      }
    },
  );
}
