import type { CatalogDetail } from '@movies/api/catalog';
import type { Page, Request, Route } from '@playwright/test';

export const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};
export async function preflight(route: Route) {
  if (route.request().method() !== 'OPTIONS') return false;
  await route.fulfill({ status: 204, headers: corsHeaders });
  return true;
}
export function readInput(request: Request) {
  if (request.method() === 'POST') return request.postDataJSON().json;
  return JSON.parse(new URL(request.url()).searchParams.get('data') ?? '{}').json;
}
export function detailFixture(type: 'movie' | 'tv'): CatalogDetail {
  const common = {
    id: 42,
    title: type === 'movie' ? 'Test movie' : 'Test series',
    releaseDate: '2026-10-10',
    posterUrl: null,
    backdropUrl: null,
    rating: 8.21,
    overview: 'A memorable story.',
    tagline: 'Beyond the horizon.',
    genres: [{ id: 12, name: 'Adventure' }],
    voteCount: 1200,
    popularity: 15.6,
    originalTitle: '',
    status: 'Released',
    languages: ['English'],
    originCountries: ['US'],
    homepage: 'https://example.com',
    certification: { value: 'R', region: 'US' },
  };
  if (type === 'movie') return { ...common, type, runtime: 125, budget: 1000, revenue: 2000 };
  return {
    ...common,
    type,
    seasons: 3,
    episodes: 24,
    episodeRuntimes: [45],
    lastAirDate: '2026-10-11',
    networks: ['A network'],
  };
}

export async function mockEmptySupport({ page }: { page: Page }) {
  await page.route(/\/rpc\/catalog\/(trailer|providers|related)(?:\?|$)/, async (route) => {
    if (await preflight(route)) return;
    const path = new URL(route.request().url()).pathname;
    let response: unknown = [];
    if (path.endsWith('/trailer')) response = null;
    if (path.endsWith('/providers'))
      response = {
        link: 'https://www.themoviedb.org/movie/42/watch',
        free: [],
        streaming: [],
        rent: [],
        buy: [],
      };
    await route.fulfill({ json: { json: response }, headers: corsHeaders });
  });
}
