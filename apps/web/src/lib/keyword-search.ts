'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';

import type { Keyword } from '@/types/keyword';

import { CACHE_TAGS } from './cache-tags';
import { tmdbFetch } from './tmdb';

const keywordQuerySchema = z.string().trim().min(2).max(100);

async function fetchKeywords(query: string): Promise<Keyword[]> {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.public.search);
  const response = await tmdbFetch<{ results: Keyword[] }>('/search/keyword', {
    searchParams: { query, page: 1 },
    errorMessage: 'Failed searching tags',
  });
  return response.results;
}

export async function searchKeywords(query: string): Promise<Keyword[]> {
  const result = keywordQuerySchema.safeParse(query);
  if (!result.success) {
    return [];
  }
  return fetchKeywords(result.data);
}
