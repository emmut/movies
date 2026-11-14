import {
  corsHeaders,
  detailFixture,
  mockEmptySupport,
  preflight,
  readInput,
} from '@native/e2e/catalog-fixtures';
import { expect, test } from '@playwright/test';

const creator = {
  id: 7,
  creditId: 'creator-7',
  name: 'A creator',
  role: 'Creator',
  profileUrl: null,
};
const film = {
  id: 43,
  type: 'movie',
  title: 'Creator film',
  releaseDate: '2025',
  posterUrl: null,
  backdropUrl: null,
  rating: 8,
};
const person = {
  id: 7,
  name: creator.name,
  biography: 'The creator biography.',
  profileUrl: null,
  birthday: null,
  deathday: null,
  birthplace: '',
  department: 'Writing',
  aliases: [],
  popularity: 1,
  homepage: null,
  imdbUrl: null,
};

test.beforeEach(async ({ page }) => {
  await mockEmptySupport({ page });
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    const input = readInput(route.request());
    const item = detailFixture(input.type);
    item.id = input.id;
    item.originCountries = [' us ', 'SE', 'US', 'ZZ'];
    if (item.type === 'tv') {
      item.creators = [creator];
    }
    if (item.id === 43) {
      item.title = film.title;
    }
    await route.fulfill({ json: { json: item }, headers: corsHeaders });
  });
  await page.route('**/rpc/person/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({ json: { json: person }, headers: corsHeaders });
  });
  await page.route('**/rpc/person/credits*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: { json: readInput(route.request()).type === 'movie' ? [film] : [] },
      headers: corsHeaders,
    });
  });
  await page.route('**/rpc/discovery/options*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: {
        json: {
          genres: [],
          providers: [],
          countries: [
            { code: 'US', name: 'United States' },
            { code: 'SE', name: 'Sweden' },
          ],
        },
      },
      headers: corsHeaders,
    });
  });
});

for (const source of ['', '/discover', '/search', '/more']) {
  test(`TV creators preserve ${source || 'Home'} context and region through filmography`, async ({
    page,
  }) => {
    const providerInputs: { id: number; region: string }[] = [];
    await page.route('**/rpc/catalog/providers*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      const input = readInput(route.request());
      providerInputs.push({ id: input.id, region: input.region });
      await route.fulfill({
        json: {
          json: {
            link: 'https://www.themoviedb.org/tv/42/watch',
            free: [],
            streaming: [],
            rent: [],
            buy: [],
          },
        },
        headers: corsHeaders,
      });
    });
    await page.goto(`${source}/tv/42?region=US`);
    const title = page.getByTestId('catalog-scroll');
    await expect(title.getByRole('heading', { name: 'Created By', exact: true })).toBeAttached();
    const link = title.getByRole('link', { name: 'Open A creator, Creator', exact: true });
    await link.scrollIntoViewIfNeeded();
    const offset = await title.evaluate((element) => element.scrollTop);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${source}/person/7\\?region=US$`));
    await expect(page.getByText(person.biography, { exact: true })).toBeAttached();
    const movie = page.getByRole('link', { name: 'Open Creator film, Movie', exact: true });
    await movie.scrollIntoViewIfNeeded();
    await movie.click();
    await expect(page).toHaveURL(new RegExp(`${source}/movie/43\\?region=US$`));
    await expect.poll(() => providerInputs).toContainEqual({ id: 43, region: 'US' });
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${source}/person/7\\?region=US$`));
    await page.goBack();
    await expect.poll(() => title.evaluate((element) => element.scrollTop)).toBeCloseTo(offset, -1);
    await expect(page).toHaveURL(new RegExp(`${source}/tv/42\\?region=US$`));
  });
}

for (const type of ['movie', 'tv']) {
  test(`${type} origin links normalize countries and preserve media/region into discovery`, async ({
    page,
  }) => {
    const inputs: unknown[] = [];
    await page.route('**/rpc/discovery/list*', async (route) => {
      if (await preflight(route)) {
        return;
      }
      inputs.push(readInput(route.request()));
      await route.fulfill({
        json: { json: { items: [], totalResults: 0, totalPages: 0 } },
        headers: corsHeaders,
      });
    });
    await page.goto(`/${type}/42?region=US`);
    const scroll = page.getByTestId('catalog-scroll');
    await expect(
      scroll.getByRole('heading', { name: 'Countries of Origin', exact: true }),
    ).toBeAttached();
    const media = type === 'movie' ? 'movies' : 'TV shows';
    const link = scroll.getByRole('link', {
      name: `Discover ${media} from United States`,
      exact: true,
    });
    await expect(link).toHaveCount(1);
    await expect(
      scroll.getByRole('link', { name: `Discover ${media} from Sweden`, exact: true }),
    ).toHaveCount(1);
    await link.scrollIntoViewIfNeeded();
    const offset = await scroll.evaluate((element) => element.scrollTop);
    await link.click();
    await expect
      .poll(() => inputs)
      .toContainEqual(expect.objectContaining({ type, originCountries: ['US'], region: 'US' }));
    expect(new URL(page.url()).searchParams.get('with_origin_country')).toBe('US');
    await page.goBack();
    await expect
      .poll(() => scroll.evaluate((element) => element.scrollTop))
      .toBeCloseTo(offset, -1);
  });
}

test('missing creators and unsupported origin metadata omit their sections', async ({ page }) => {
  await page.route('**/rpc/catalog/details*', async (route) => {
    if (await preflight(route)) {
      return;
    }
    await route.fulfill({
      json: { json: { ...detailFixture('tv'), originCountries: ['ZZ', 'invalid'], creators: [] } },
      headers: corsHeaders,
    });
  });
  await page.goto('/tv/42');
  await expect(page.getByText('A memorable story.', { exact: true })).toBeAttached();
  const scroll = page.getByTestId('catalog-scroll');
  await expect(scroll.getByRole('heading', { name: 'Created By', exact: true })).not.toBeAttached();
  await expect(scroll.getByRole('heading', { name: /Countr.* of Origin/ })).not.toBeAttached();
});

test('invalid person-region overrides use the current region for filmography links', async ({
  page,
}) => {
  await page.goto('/search/person/7?region=XX');
  const link = page.getByRole('link', { name: 'Open Creator film, Movie', exact: true });
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(page).toHaveURL(/\/search\/movie\/43\?region=SE$/);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`creators and origin actions preserve the product appearance in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/tv/42');
    const scroll = page.getByTestId('catalog-scroll');
    const heading = scroll.getByRole('heading', { name: 'Created By', exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(
      scroll.getByRole('link', { name: 'Open A creator, Creator', exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: `/tmp/pr350-native-creators-${colorScheme}.png` });
    await scroll
      .getByRole('heading', { name: 'Countries of Origin', exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/pr350-native-origins-${colorScheme}.png` });
  });
}
