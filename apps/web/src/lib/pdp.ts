import 'server-only';
import { DEFAULT_REGION, type RegionCode } from '@movies/config/regions';
import { cacheLife, cacheTag } from 'next/cache';

import { createServerApi } from '@/lib/api-server';

import { CACHE_TAGS } from './cache-tags';

export async function getPdpExtras(
  type: 'movie' | 'tv',
  id: number,
  region: RegionCode = DEFAULT_REGION,
) {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.public[type].details(id));
  return createServerApi(new Headers()).catalog.extras({ type, id, region });
}

export async function getCollection(id: number) {
  'use cache: remote';
  cacheLife('days');
  return createServerApi(new Headers()).catalog.collection({ id });
}

export async function getSeason(id: number, season: number) {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.public.tv.details(id));
  return createServerApi(new Headers()).catalog.season({ id, season });
}

export async function getAggregateCredits(id: number) {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.public.tv.credits(id));
  return createServerApi(new Headers()).catalog.aggregateCredits({ id });
}

export async function getKeyword(id: number) {
  'use cache: remote';
  cacheLife('days');
  const items = await createServerApi(new Headers()).discovery.facets({
    kind: 'keyword',
    ids: [id],
    query: '',
  });
  return items[0] ?? { id, name: `Keyword ${id}` };
}
