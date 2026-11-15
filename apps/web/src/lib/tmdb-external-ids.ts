import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';

import { createServerApi } from '@/lib/api-server';

import { CACHE_TAGS } from './cache-tags';

/** One cached response shared by IMDb and Wikidata readers. */
export async function getTmdbExternalIds(type: 'movie' | 'tv', id: number) {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.public[type].details(id));
  if (type === 'tv') {
    cacheTag(CACHE_TAGS.public.tv.imdbId(id));
  }
  return createServerApi(new Headers()).catalog.externalIds({ type, id });
}
