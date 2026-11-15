import 'server-only';
import type { HomeMediaCategory } from '@movies/api/home';
import { DEFAULT_REGION } from '@movies/config/regions';
import { cacheLife } from 'next/cache';

import { createServerApi } from '@/lib/api-server';

/** Request-independent public API reads keep the home shell prerenderable. */
export async function getHomeMediaList(category: HomeMediaCategory, region = DEFAULT_REGION) {
  'use cache: remote';
  cacheLife('minutes');
  return createServerApi(new Headers()).home.list({ category, region });
}
