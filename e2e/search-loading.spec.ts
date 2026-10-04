import { expect, test } from '@playwright/test';

import { MOVIE_PATH } from './helpers';

type SearchLoadingSample = {
  clipped: boolean;
  phase: 'loading' | 'loaded';
  scrollY: number;
};

declare global {
  interface Window {
    __searchLoadingSamples?: SearchLoadingSample[];
    __searchLoadingSampleTimer?: ReturnType<typeof setInterval>;
  }
}

test('search shows a complete grid skeleton at the top of the page', async ({ page }) => {
  const query = 'matrix';
  const searchPrefetched = page.waitForResponse(
    (response) => {
      const url = new URL(response.url());
      return (
        url.pathname === '/search' &&
        url.searchParams.get('q') === query &&
        url.searchParams.get('mediaType') === 'all' &&
        [...url.searchParams.keys()].every(
          (key) => key === 'q' || key === 'mediaType' || key === '_rsc',
        )
      );
    },
    { timeout: 15_000 },
  );

  await page.goto(MOVIE_PATH);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.getByRole('button', { name: /search/i }).click();
  const input = page.getByRole('searchbox', { name: /search for movies/i });
  await input.fill(query);
  const seeAll = page.getByRole('link', {
    name: new RegExp(`see all results for “${query}”`, 'i'),
  });
  await expect(seeAll).toBeVisible({ timeout: 15_000 });
  await searchPrefetched;
  await page.waitForLoadState('networkidle');

  await page.keyboard.press('Escape');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);

  const client = await page.context().newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (2000 * 1024) / 8,
    uploadThroughput: 1024 * 1024,
  });

  await page.evaluate(() => {
    window.__searchLoadingSamples = [];
    window.__searchLoadingSampleTimer = setInterval(() => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>('.aspect-2\\/3')).filter(
        (element) => element.checkVisibility(),
      );
      const content = document.querySelector<HTMLElement>('#content');
      const grid = cards[0]?.parentElement;
      const onSearchPage = location.pathname === '/search';

      if (!onSearchPage || !grid) return;

      const gridBottom = grid.getBoundingClientRect().bottom;
      window.__searchLoadingSamples?.push({
        clipped: cards.some((card) => card.getBoundingClientRect().bottom > gridBottom + 1),
        phase: content?.checkVisibility() ? 'loaded' : 'loading',
        scrollY: Math.round(window.scrollY),
      });
    }, 25);
  });

  await page.getByRole('button', { name: /search/i }).click();
  await page.getByRole('searchbox', { name: /search for movies/i }).fill(query);
  await page.getByRole('link', { name: new RegExp(`see all results for “${query}”`, 'i') }).click();

  await page.waitForURL(/\/search\?q=matrix/);
  await expect(page.locator('#content')).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 })
    .toBeLessThan(50);
  // Leave the sampler running briefly after the loaded content commits. This
  // guards the reverse transition too: a correctly positioned skeleton must
  // not be replaced by a loaded page that settles partway down.
  await page.waitForTimeout(250);

  const samples = await page.evaluate(() => {
    clearInterval(window.__searchLoadingSampleTimer);
    return window.__searchLoadingSamples ?? [];
  });

  const loadingSamples = samples.filter((sample) => sample.phase === 'loading');
  const loadedSamples = samples.filter((sample) => sample.phase === 'loaded');

  expect(loadingSamples.length).toBeGreaterThan(0);
  expect(loadingSamples.every((sample) => !sample.clipped)).toBe(true);
  expect(loadingSamples.every((sample) => sample.scrollY < 50)).toBe(true);

  expect(loadedSamples.length).toBeGreaterThan(0);
  expect(loadedSamples.every((sample) => sample.scrollY < 50)).toBe(true);
});
