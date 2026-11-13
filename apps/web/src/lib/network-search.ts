'use server';

import { cacheLife } from 'next/cache';
import { z } from 'zod';

import { getNetworkCatalog } from './network-catalog';
import { optional, tmdbFetch } from './tmdb';

type Network = { id: number; name: string };
const querySchema = z.string().trim().min(2).max(100);
const idsSchema = z.array(z.number().int().positive()).max(50);

export async function searchNetworks(query: string): Promise<Network[]> {
  const result = querySchema.safeParse(query);
  if (!result.success) {
    return [];
  }
  const term = result.data.toLocaleLowerCase();
  const networks = await getNetworkCatalog();
  return networks
    .filter((network) => network.name.toLocaleLowerCase().includes(term))
    .sort(
      (a, b) =>
        Number(b.name.toLocaleLowerCase() === term) - Number(a.name.toLocaleLowerCase() === term) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 20);
}

async function fetchNetwork(id: number): Promise<Network> {
  'use cache: remote';
  cacheLife('days');
  const network = await tmdbFetch<Network>(`/network/${id}`, {
    errorMessage: 'Failed loading network',
  });
  return { id, name: network.name };
}

export async function getNetworks(ids: number[]): Promise<Network[]> {
  const result = idsSchema.safeParse(ids);
  if (!result.success) {
    return [];
  }
  return Promise.all(
    [...new Set(result.data)].map((id) =>
      optional(fetchNetwork(id), { id, name: `Network ${id}` }),
    ),
  );
}
