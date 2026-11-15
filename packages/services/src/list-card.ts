import 'server-only';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';

import { tmdbCardSchema, toMediaCard } from './media-card';

/** Hydrate a persisted title without trusting the upstream resource identity. */
export async function hydrateListCard(
  fetchTmdb: TmdbFetch,
  row: { id: string; resourceId: number },
  resourceType: 'movie' | 'tv',
) {
  const raw = tmdbCardSchema.parse(await fetchTmdb('/' + resourceType + '/' + row.resourceId));
  if (raw.id !== row.resourceId) {
    throw new Error('Unexpected title identifier');
  }
  return { ...toMediaCard(raw, resourceType), listItemId: row.id };
}
