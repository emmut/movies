import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';

import type { TmdbExternalIdsResponse } from '@/types/tv-show';

import { CACHE_TAGS } from './cache-tags';
import { tmdbFetch } from './tmdb';

/** One cached response shared by IMDb and Wikidata readers. */
export async function getTmdbExternalIds(type: 'movie' | 'tv', id: number) {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.public[type].details(id));
  if (type === 'tv') {
    cacheTag(CACHE_TAGS.public.tv.imdbId(id));
  }
  return tmdbFetch<Pick<TmdbExternalIdsResponse, 'imdb_id' | 'wikidata_id'>>(
    `/${type}/${id}/external_ids`,
  );
}
