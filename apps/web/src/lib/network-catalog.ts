import 'server-only';
import { gunzipSync } from 'node:zlib';

import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';

import { CACHE_TAGS } from './cache-tags';

const networkSchema = z.object({ id: z.number().int().positive(), name: z.string().min(1) });

/** TMDB has no network search endpoint; its daily export contains all network names. */
export async function getNetworkCatalog() {
  'use cache: remote';
  cacheLife('days');
  cacheTag(CACHE_TAGS.public.search);
  // Yesterday's export is complete even before today's publication at 08:00 UTC.
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  const stamp = [date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCFullYear()]
    .map((part) => String(part).padStart(2, '0'))
    .join('_');
  const response = await fetch(`https://files.tmdb.org/p/exports/tv_network_ids_${stamp}.json.gz`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error('Failed loading network catalogue');
  }
  const data = gunzipSync(Buffer.from(await response.arrayBuffer()), {
    maxOutputLength: 10_000_000,
  });
  const networks = data
    .toString('utf8')
    .trim()
    .split('\n')
    .map((line) => networkSchema.parse(JSON.parse(line)));
  if (networks.length === 0) {
    throw new Error('Empty network catalogue');
  }
  return networks;
}
