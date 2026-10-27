import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';

import type { AggregateCredits, CollectionDetails, PdpExtras, SeasonDetails } from '@/types/pdp';

import { CACHE_TAGS } from './cache-tags';
import { tmdbFetch } from './tmdb';

export async function getPdpExtras(type: 'movie' | 'tv', id: number) {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.public[type].details(id));
  return tmdbFetch<PdpExtras>(`/${type}/${id}`, {
    searchParams: {
      append_to_response:
        type === 'movie' ? 'images,keywords,videos,release_dates' : 'images,keywords,videos',
      include_image_language: 'en,null',
    },
    errorMessage: 'Failed loading additional title information',
  });
}

export async function getCollection(id: number) {
  'use cache: remote';
  cacheLife('days');
  return tmdbFetch<CollectionDetails>(`/collection/${id}`, {
    errorMessage: 'Failed loading collection',
  });
}

export async function getSeason(id: number, season: number) {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.public.tv.details(id));
  return tmdbFetch<SeasonDetails>(`/tv/${id}/season/${season}`, {
    errorMessage: 'Failed loading season',
  });
}

export async function getAggregateCredits(id: number) {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.public.tv.credits(id));
  return tmdbFetch<AggregateCredits>(`/tv/${id}/aggregate_credits`, {
    errorMessage: 'Failed loading series credits',
  });
}

export async function getKeywordTitles(id: number, type: 'movie' | 'tv', page: number) {
  'use cache: remote';
  cacheLife('hours');
  return tmdbFetch<{
    results: (import('@/types/movie').Movie | import('@/types/tv-show').TvShow)[];
    total_pages: number;
  }>(`/discover/${type}`, {
    searchParams: { with_keywords: id, page, include_adult: 'false', sort_by: 'popularity.desc' },
    errorMessage: 'Failed loading titles for this keyword',
  });
}

export async function getKeyword(id: number) {
  'use cache: remote';
  cacheLife('days');
  return tmdbFetch<{ name: string }>(`/keyword/${id}`, { errorMessage: 'Failed loading keyword' });
}
