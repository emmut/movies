import 'server-only';
import { cacheLife } from 'next/cache';
import { z } from 'zod';

import { env } from '@/env';
import { buildPopcornTimeAvailability } from '@/lib/popcorntime-watch-links';
import type { PopcornTimeAvailability } from '@/types/watch-provider';

const mediaIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const candidateSchema = z.object({ id: mediaIdSchema, kind: z.enum(['movie', 'tv_show']) });
const mediaSchema = z.object({
  id: mediaIdSchema,
  content_type: z.enum(['movie', 'tv_show']),
  external_ids: z.array(z.object({ source: z.string(), id: z.string() })),
});

async function request(path: string, params: Record<string, string>, signal: AbortSignal) {
  const url = new URL(`https://api.popcorntime.app/v1/${path}`);
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${env.POPCORNTIME_API_KEY}` },
    redirect: 'error',
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error(`Popcorn Time request failed (${response.status})`);
  return response.json() as Promise<unknown>;
}

async function getProviderRegistry(region: string) {
  'use cache: remote';
  cacheLife({ stale: 3600, revalidate: 86400, expire: 172800 });
  return z
    .object({ country: z.literal(region), providers: z.array(z.unknown()) })
    .parse(
      await request(
        'providers',
        { country: region, hide_children: 'false' },
        AbortSignal.timeout(4000),
      ),
    );
}

async function getTitleOffers(type: 'movie' | 'tv', id: number, title: string, region: string) {
  'use cache: remote';
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
  // One deadline bounds the complete search/detail/link sequence; no automatic retries.
  const signal = AbortSignal.timeout(4000);
  const kind = type === 'movie' ? 'movie' : 'tv_show';
  const search = z
    .object({ results: z.array(z.unknown()) })
    .parse(
      await request('search', { q: title, kind, country: region, lang: 'en', limit: '3' }, signal),
    );
  const candidates = new Set(
    search.results.slice(0, 3).flatMap((raw) => {
      const result = candidateSchema.safeParse(raw);
      return result.success && result.data.kind === kind ? [result.data.id] : [];
    }),
  );
  const verified = await Promise.all(
    [...candidates].map(async (candidateId) => {
      const result = mediaSchema.safeParse(await request(`media/${candidateId}`, {}, signal));
      if (!result.success || result.data.id !== candidateId || result.data.content_type !== kind) {
        return null;
      }
      const ids = result.data.external_ids.filter((external) => external.source === 'tmdb');
      return ids.length === 1 && ids[0].id === String(id) ? candidateId : null;
    }),
  );
  const matches = verified.filter((match) => match !== null);
  if (matches.length !== 1) return null;
  return z
    .array(z.unknown())
    .parse(await request(`media/${matches[0]}/links`, { country: region }, signal));
}

/** Optional primary link source. Missing credentials and upstream failures keep Wikidata usable. */
export async function getPopcornTimeAvailability(
  type: 'movie' | 'tv',
  id: number,
  title: string,
  region: string,
): Promise<PopcornTimeAvailability | null> {
  if (!env.POPCORNTIME_API_KEY) return null;
  try {
    const [offers, registry] = await Promise.all([
      getTitleOffers(type, id, title, region),
      getProviderRegistry(region),
    ]);
    if (offers === null) return null;
    return buildPopcornTimeAvailability(
      registry,
      offers,
      region,
      new Date().toISOString().slice(0, 10),
    );
  } catch {
    // Never log upstream bodies/URLs: they may contain credentials or account details.
    console.warn('Popcorn Time title links unavailable; using fallback links.');
    return null;
  }
}
