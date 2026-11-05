import 'server-only';
import { cacheLife } from 'next/cache';
import { z } from 'zod';

import { buildAppleCatalogueLinks } from '@/lib/apple-catalogue-links';
import { getMovieCredits } from '@/lib/movies';
import type { DirectWatchLink, WatchTitleContext } from '@/types/watch-provider';

let nextRequestAt = 0;
let cooldownUntil = 0;
let waitingRequests = 0;
let requestQueue = Promise.resolve();
class CatalogueBudgetError extends Error {}

async function waitForCatalogueSlot() {
  if (Date.now() < cooldownUntil || waitingRequests >= 2) throw new CatalogueBudgetError();
  waitingRequests += 1;
  const previous = requestQueue;
  const slot = Promise.withResolvers<void>();
  requestQueue = slot.promise;
  try {
    await previous;
    if (Date.now() < cooldownUntil) throw new CatalogueBudgetError();
    const delay = Math.max(0, nextRequestAt - Date.now());
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    // A preceding request may have received 429 while this one was waiting.
    if (Date.now() < cooldownUntil) throw new CatalogueBudgetError();
    nextRequestAt = Date.now() + 3100;
  } finally {
    waitingRequests -= 1;
    slot.resolve();
  }
}

async function searchCatalogue(type: 'movie' | 'tv', title: string, region: string) {
  'use cache: remote';
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  // Best-effort per-process guard for Apple's documented ~20 requests/minute limit.
  await waitForCatalogueSlot();
  const url = new URL('https://itunes.apple.com/search');
  url.search = new URLSearchParams({
    term: title,
    country: region.toLowerCase(),
    media: type === 'movie' ? 'movie' : 'tvShow',
    entity: type === 'movie' ? 'movie' : 'tvSeason',
    attribute: type === 'movie' ? 'movieTerm' : 'showTerm',
    lang: 'en_us',
    limit: '25',
  }).toString();
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(3000),
  });
  if (response.status === 429) cooldownUntil = Date.now() + 60000;
  if (!response.ok) throw new Error('Apple catalogue request failed');
  // Drop media assets at the boundary; the app uses destination metadata only.
  const root = z.object({ results: z.array(z.unknown()).max(200) }).parse(await response.json());
  const metadata = z.object({
    wrapperType: z.string().optional(),
    kind: z.string().optional(),
    collectionType: z.string().optional(),
    trackId: z.number().optional(),
    trackName: z.string().optional(),
    artistName: z.string().optional(),
    releaseDate: z.string().optional(),
    trackViewUrl: z.string().optional(),
    collectionName: z.string().optional(),
    artistViewUrl: z.string().optional(),
  });
  return {
    results: root.results.flatMap((row) => {
      const parsed = metadata.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    }),
  };
}

export async function getAppleCatalogueLinks(
  context: WatchTitleContext,
  region: string,
): Promise<DirectWatchLink[]> {
  if (
    !context.title.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(context.releaseDate) ||
    !/^[A-Z]{2}$/.test(region)
  )
    return [];
  try {
    const directors =
      context.type === 'movie'
        ? (await getMovieCredits(context.id)).crew
            .filter((person) => person.job === 'Director')
            .map((person) => person.name)
        : [];
    if (context.type === 'movie' && !directors.length) return [];
    const data = await searchCatalogue(context.type, context.title, region);
    return buildAppleCatalogueLinks(data, context, region, directors);
  } catch (error) {
    if (!(error instanceof CatalogueBudgetError))
      console.warn('Apple catalogue links unavailable; using existing watch options.');
    return [];
  }
}
