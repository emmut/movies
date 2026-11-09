'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';

import { CACHE_TAGS } from './cache-tags';
import { optional, tmdbFetch } from './tmdb';

type Company = { id: number; name: string };
const companyQuerySchema = z.string().trim().min(2).max(100);
const companyIdsSchema = z.array(z.number().int().positive()).max(50);

async function fetchCompanies(query: string): Promise<Company[]> {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.public.search);
  const response = await tmdbFetch<{ results: Company[] }>('/search/company', {
    searchParams: { query, page: 1 },
    errorMessage: 'Failed searching production companies',
  });
  return response.results.map(({ id, name }) => ({ id, name }));
}

export async function searchCompanies(query: string): Promise<Company[]> {
  const result = companyQuerySchema.safeParse(query);
  return result.success ? fetchCompanies(result.data) : [];
}

async function fetchCompany(id: number): Promise<Company> {
  'use cache: remote';
  cacheLife('days');
  const company = await tmdbFetch<Company>(`/company/${id}`, {
    errorMessage: 'Failed loading production company',
  });
  return { id, name: company.name };
}

export async function getCompanies(ids: number[]): Promise<Company[]> {
  const result = companyIdsSchema.safeParse(ids);
  if (!result.success) {
    return [];
  }
  return Promise.all(
    [...new Set(result.data)].map((id) =>
      optional(fetchCompany(id), { id, name: `Company ${id}` }),
    ),
  );
}
