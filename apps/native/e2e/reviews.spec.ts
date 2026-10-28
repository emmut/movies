import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { expect, test } from '@playwright/test';

const longContent =
  'A thoughtful review of this story, its characters and its performances. '.repeat(12) +
  '\nA final paragraph.';
const firstReview = {
  id: 'review-a',
  author: 'First reviewer',
  rating: 0,
  content: longContent,
  createdAt: '2026-10-28T12:00:00Z',
  url: 'https://www.themoviedb.org/review/review-a',
};
const pageOne = {
  page: 1,
  totalPages: 2,
  totalResults: 22,
  reviews: [
    firstReview,
    {
      ...firstReview,
      id: 'review-b',
      author: 'Second reviewer',
      rating: null,
      createdAt: 'invalid',
      content: 'A short review.',
    },
    {
      ...firstReview,
      id: 'review-c',
      author: 'Third reviewer',
      rating: 9.5,
      content: 'Another short review.',
    },
    { ...firstReview, id: 'review-d', author: 'Fourth reviewer' },
  ],
};
const pageTwo = {
  ...pageOne,
  page: 2,
  reviews: [
    {
      ...firstReview,
      id: 'review-page-two',
      author: 'Page two reviewer',
      content: 'The final review page.',
    },
  ],
};

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: { json: detailFixture(readInput(route.request()).type) },
      headers: corsHeaders,
    });
  });
  await page.route('**/rpc/catalog/reviews*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    expect(input.id).toBe(42);
    expect(['movie', 'tv']).toContain(input.type);
    await route.fulfill({
      json: { json: input.page === 2 ? pageTwo : pageOne },
      headers: corsHeaders,
    });
  });
});

for (const source of ['', '/discover', '/search', '/more']) {
  test(`all reviews preserve ${source || 'Home'} context and title reading position`, async ({
    page,
  }) => {
    await page.goto(`${source}/movie/42?region=US`);
    const teaser = page.getByTestId('catalog-scroll');
    await expect(teaser.getByRole('heading', { name: 'Reviews (22)', exact: true })).toBeAttached();
    await expect(teaser.getByText('Fourth reviewer', { exact: true })).not.toBeAttached();
    const all = teaser.getByRole('link', { name: 'View all 22 reviews', exact: true });
    await all.scrollIntoViewIfNeeded();
    const before = await teaser.evaluate((element) => element.scrollTop);
    await all.click();
    await expect(page).toHaveURL(new RegExp(`${source}/movie/42/reviews\\?region=US$`));
    const reviews = page.getByTestId('reviews-scroll');
    await expect(
      reviews.getByText('22 reviews of Test movie from TMDb', { exact: true }),
    ).toBeAttached();
    await expect(reviews.getByText('Fourth reviewer', { exact: true })).toBeAttached();
    await expect(reviews.getByRole('button', { name: /Show more/ })).toHaveCount(0);
    await page.goBack();
    await expect
      .poll(() => teaser.evaluate((element) => element.scrollTop))
      .toBeCloseTo(before, -1);
    await expect(page).toHaveURL(new RegExp(`${source}/movie/42\\?region=US$`));
  });
}

test('review previews expand individually, retain zero ratings and offer source attribution', async ({
  page,
  context,
}) => {
  await context.route('https://www.themoviedb.org/review/review-a', (route) =>
    route.fulfill({ body: '<html><body>TMDb review</body></html>', contentType: 'text/html' }),
  );
  await page.goto('/tv/42');
  const card = page.getByTestId('catalog-scroll').getByTestId('review-review-a');
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByLabel('Rating 0 out of 10')).toBeAttached();
  await expect(card.getByText('Oct 28, 2026', { exact: true })).toBeAttached();
  const expand = card.getByRole('button', { name: 'Show more of First reviewer’s review' });
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
  await expand.click();
  const collapse = card.getByRole('button', { name: 'Show less of First reviewer’s review' });
  await expect(collapse).toHaveAttribute('aria-expanded', 'true');
  await collapse.click();
  await expect(expand).toBeAttached();
  const second = page.getByTestId('catalog-scroll').getByTestId('review-review-b');
  await expect(second.getByRole('button', { name: /Show more/ })).toHaveCount(0);
  await expect(second.getByLabel(/Rating/)).toHaveCount(0);
  await expect(page.getByText('Invalid Date', { exact: true })).not.toBeAttached();
  const popup = context.waitForEvent('page');
  const attribution = card.getByRole('link', { name: 'Read on TMDb (opens browser)' });
  await expect(attribution.locator('svg')).toHaveCSS('width', '16px');
  await expect(attribution.locator('svg')).toHaveCSS('height', '16px');
  await attribution.click();
  const source = await popup;
  await expect(source).toHaveURL(firstReview.url);
  await source.close();
});

test('full reviews paginate natively, start a new page at the top and preserve media/region', async ({
  page,
}) => {
  await page.goto('/discover/tv/42/reviews?region=US');
  const list = page.getByTestId('reviews-scroll');
  const next = list.getByRole('button', { name: 'Next page', exact: true });
  await next.scrollIntoViewIfNeeded();
  await next.click();
  await expect(page).toHaveURL(/page=2/);
  expect(new URL(page.url()).searchParams.get('region')).toBe('US');
  await expect(list.getByText('Page two reviewer', { exact: true })).toBeAttached();
  await expect(list.getByText('Page 2 of 2', { exact: true })).toBeAttached();
  await expect(list.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBe(0);
  await list.getByRole('button', { name: 'Previous page', exact: true }).click();
  await expect(list.getByText('First reviewer', { exact: true })).toBeAttached();
  await list.getByRole('link', { name: '← Back to Test series', exact: true }).click();
  await expect(page).toHaveURL(/\/discover\/tv\/42\?region=US$/);
});

test('review outages retry without discarding the title', async ({ page }) => {
  let fail = true;
  await page.route('**/rpc/catalog/reviews*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    if (fail) {
      await route.fulfill({
        status: 500,
        json: { message: 'Internal server error' },
        headers: corsHeaders,
      });
      return;
    }
    await route.fulfill({ json: { json: pageOne }, headers: corsHeaders });
  });
  await page.goto('/movie/42');
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  const retry = page.getByRole('button', { name: 'Retry reviews' });
  await retry.scrollIntoViewIfNeeded();
  fail = false;
  await retry.click();
  await expect(
    page.getByTestId('catalog-scroll').getByText('First reviewer', { exact: true }),
  ).toBeAttached();
  await expect(retry).not.toBeAttached();
});

test('direct review pages distinguish loading, failure/retry and genuine empty results', async ({
  page,
}) => {
  let release = function release() {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  let fail = true;
  await page.route('**/rpc/catalog/reviews*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await ready;
    if (fail) {
      await route.fulfill({
        status: 500,
        json: { message: 'Internal server error' },
        headers: corsHeaders,
      });
      return;
    }
    await route.fulfill({
      json: { json: { page: 1, totalPages: 0, totalResults: 0, reviews: [] } },
      headers: corsHeaders,
    });
  });
  await page.goto('/search/movie/42/reviews');
  await expect(page.getByLabel('Loading reviews')).toBeAttached();
  release();
  await expect(page.getByText('Couldn’t load reviews.', { exact: true })).toBeAttached();
  fail = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  const list = page.getByTestId('reviews-scroll');
  await expect(list.getByText('No reviews yet.', { exact: true })).toBeAttached();
  await expect(list.getByText('0 reviews of Test movie from TMDb', { exact: true })).toBeAttached();
  await expect(list.getByRole('button', { name: 'Next page', exact: true })).not.toBeAttached();
});

test('empty teaser reviews stay hidden and malformed title routes never request reviews', async ({
  page,
}) => {
  let calls = 0;
  await page.route('**/rpc/catalog/reviews*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    calls += 1;
    await route.fulfill({
      json: { json: { page: 1, totalPages: 0, totalResults: 0, reviews: [] } },
      headers: corsHeaders,
    });
  });
  await page.goto('/movie/42');
  await expect.poll(() => calls).toBe(1);
  await expect(
    page.getByTestId('catalog-scroll').getByRole('heading', { name: /^Reviews/ }),
  ).not.toBeAttached();
  await page.goto('/movie/2+2/reviews');
  await expect(page.getByRole('heading', { name: 'Invalid title', exact: true })).toBeAttached();
  expect(calls).toBe(1);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`review cards remain readable in ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/movie/42');
    const card = page.getByTestId('catalog-scroll').getByTestId('review-review-a');
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByText('First reviewer', { exact: true })).toBeVisible();
    const contrast = await card.evaluate((element) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d')!;
      function luminance(color: string) {
        context.fillStyle = getComputedStyle(element).backgroundColor;
        context.fillRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => {
          const normalized = value / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      }
      const background = luminance(getComputedStyle(element).backgroundColor);
      return [...element.querySelectorAll('[dir="auto"]')].map((text) => {
        const foreground = luminance(getComputedStyle(text).color);
        return (
          (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
        );
      });
    });
    expect(contrast.length).toBeGreaterThan(0);
    for (const ratio of contrast) {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
    await page.screenshot({ path: `/tmp/pr350-native-reviews-${colorScheme}.png` });
  });
}

test('slow review previews leave the title and overview usable', async ({ page }) => {
  let release = function release() {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/rpc/catalog/reviews*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await ready;
    await route.fulfill({ json: { json: pageOne }, headers: corsHeaders });
  });
  await page.goto('/movie/42');
  await expect(page.getByLabel('Loading reviews')).toBeAttached();
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  release();
  await expect(
    page.getByTestId('catalog-scroll').getByText('First reviewer', { exact: true }),
  ).toBeAttached();
  await expect(page.getByLabel('Loading reviews')).not.toBeAttached();
});
