import 'server-only';
import { loadNetworkCatalog } from '@movies/api/network-catalog';
import { cacheLife, cacheTag } from 'next/cache';

import { CACHE_TAGS } from './cache-tags';

export async function getNetworkCatalog() {
  'use cache: remote';
  cacheLife('days');
  cacheTag(CACHE_TAGS.public.search);
  return loadNetworkCatalog();
}
