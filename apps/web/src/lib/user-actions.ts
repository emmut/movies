import 'server-only';
import { selectWatchProviders } from '@movies/api/preferences';
import { DEFAULT_REGION } from '@movies/config/regions';
import { headers } from 'next/headers';

import { createServerApi } from '@/lib/api-server';
import { getUser } from '@/lib/auth-server';

/** Server presentation helpers use the same authenticated API as client hooks. */
export async function getUserRegion() {
  const user = await getUser();
  if (!user) {
    return DEFAULT_REGION;
  }
  const { region } = await createServerApi(await headers()).preferences.region();
  return region;
}

export async function getUserWatchProviders() {
  const user = await getUser();
  if (!user) {
    return [];
  }
  const { providerIds } = await createServerApi(await headers()).preferences.providers();
  return providerIds;
}

/** Raw priority metadata is retained for web's existing provider filter presentation. */
export async function getAllWatchProviders(region?: string) {
  const providers = await createServerApi(new Headers()).discovery.providerCatalog({
    type: 'movie',
    region: region ?? (await getUserRegion()),
  });
  return providers.map((provider) => ({ ...provider, logo_path: provider.logo_path ?? '' }));
}

export async function getWatchProviders(region?: string, providerIds?: number[]) {
  return selectWatchProviders(await getAllWatchProviders(region), providerIds);
}
