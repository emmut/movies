import 'server-only';
import type { SystemListMembership } from '@movies/api/system-lists';
import { headers } from 'next/headers';

import { createServerApi } from '@/lib/api-server';
import { getUser } from '@/lib/auth-server';

/** Watchlist/watched state for a title page; signed-out visitors have none. */
export async function getSystemListMemberships(
  resourceId: number,
  resourceType: 'movie' | 'tv',
): Promise<SystemListMembership> {
  const user = await getUser();
  if (!user) {
    return { inWatchlist: false, watched: false };
  }
  return createServerApi(await headers()).systemLists.memberships({ resourceId, resourceType });
}
