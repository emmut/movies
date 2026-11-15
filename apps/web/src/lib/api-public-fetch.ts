import 'server-only';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { readWikidataClaims } from '@movies/services/watch-links-service';
import { cacheLife } from 'next/cache';

import { tmdbFetch } from '@/lib/tmdb';

/** Public upstream reads share Next's remote cache; authenticated data never enters it. */
export async function apiPublicFetch<T>(
  path: string,
  options?: Parameters<TmdbFetch>[1],
): Promise<T> {
  'use cache: remote';
  cacheLife('minutes');
  return tmdbFetch<T>(path, options);
}

/** Cache successes at the upstream boundary so optional failures are retried next request. */
export async function apiWikidataClaims(itemId: string) {
  'use cache: remote';
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  return readWikidataClaims(itemId);
}
