import 'server-only';
import { cacheLife } from 'next/cache';
import { z } from 'zod';

import { env } from '@/env';
import type { DirectWatchOffer, WatchOfferType } from '@/types/watch-provider';

const sourceSchema = z.object({
  name: z.string().min(1),
  region: z.string().regex(/^[A-Z]{2}$/),
  type: z.enum(['sub', 'rent', 'buy', 'free', 'tve']),
  web_url: z.url().refine((value) => {
    const url = URL.parse(value);
    return url !== null && url.protocol === 'https:' && !url.username && !url.password;
  }),
});

const offerTypes: Record<string, WatchOfferType> = {
  sub: 'flatrate',
  rent: 'rent',
  buy: 'buy',
  free: 'free',
};

async function fetchWatchmodeOffers(type: 'movie' | 'tv', id: number): Promise<DirectWatchOffer[]> {
  'use cache: remote';
  // One lookup covers all countries enabled on the plan, including region changes.
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });
  const url = new URL(`https://api.watchmode.com/v1/title/${type}-${id}/sources/`);
  url.searchParams.set('apiKey', env.WATCHMODE_API_KEY!);
  const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) {
    throw new Error(`Watchmode request failed (${response.status})`);
  }
  const sources = z.array(z.unknown()).parse(await response.json());
  return sources.flatMap((source) => {
    const parsed = sourceSchema.safeParse(source);
    if (!parsed.success || parsed.data.type === 'tve') {
      return [];
    }
    return [
      {
        providerName: parsed.data.name,
        region: parsed.data.region,
        type: offerTypes[parsed.data.type],
        url: parsed.data.web_url,
      },
    ];
  });
}

export async function getDirectWatchOffers(
  type: 'movie' | 'tv',
  id: number,
): Promise<DirectWatchOffer[]> {
  if (!env.WATCHMODE_API_KEY) {
    return [];
  }
  try {
    return await fetchWatchmodeOffers(type, id);
  } catch {
    // Keep failures outside the cache; never log upstream errors containing the API key.
    console.warn('Direct watch links unavailable; using TMDB watch options.');
    return [];
  }
}
