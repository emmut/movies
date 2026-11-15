import 'server-only';
import { appRouter, type AppContext } from '@movies/api/router';
import { sessionUserSchema, type SessionUser } from '@movies/api/session';
import { createServices } from '@movies/services/create-services';
import { createRouterClient } from '@orpc/server';

import { invalidateApiMutation } from '@/lib/api-cache-invalidation';
import { apiPublicFetch, apiWikidataClaims } from '@/lib/api-public-fetch';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const services = createServices(apiPublicFetch, db, { readWikidataClaims: apiWikidataClaims });

async function readSessionUser(headers: Headers): Promise<SessionUser | null> {
  const result = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
  if (!result) {
    return null;
  }
  return sessionUserSchema.parse({
    ...result.user,
    image: result.user.image ?? null,
    isAnonymous: result.user.isAnonymous ?? false,
  });
}

export function createApiContext(headers: Headers): AppContext {
  let session: Promise<SessionUser | null> | undefined;
  return {
    ...services,
    onMutation: invalidateApiMutation,
    session: {
      current() {
        session ??= readSessionUser(headers);
        return session;
      },
    },
  };
}

/** Server callers get the same validation and authorization without an HTTP round trip. */
export function createServerApi(headers: Headers) {
  return createRouterClient(appRouter, { context: createApiContext(headers) });
}
