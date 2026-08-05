import 'server-only';

import { headers } from 'next/headers';

import { getBackHref } from './back-href';

/**
 * Resolves the detail-page back button target from the current request's
 * headers. Thin wrapper around {@link getBackHref} so pages don't repeat the
 * header plumbing.
 */
export async function getBackHrefFromHeaders(): Promise<string> {
  const headersList = await headers();

  return getBackHref(headersList.get('referer'), [
    headersList.get('host'),
    headersList.get('x-forwarded-host'),
  ]);
}
