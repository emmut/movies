import 'server-only';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
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
