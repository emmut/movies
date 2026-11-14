import 'server-only';
import { appRouter, type AppContext } from '@movies/api/router';
import { sessionUserSchema } from '@movies/api/session';
import { createServices } from '@movies/services/create-services';
import { createRouterClient } from '@orpc/server';

import { apiPublicFetch } from '@/lib/api-public-fetch';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const services = createServices(apiPublicFetch, db);

export function createApiContext(headers: Headers): AppContext {
  let session: Promise<ReturnType<typeof sessionUserSchema.parse> | null> | undefined;
  async function current() {
    const result = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
    return result
      ? sessionUserSchema.parse({
          ...result.user,
          image: result.user.image ?? null,
          isAnonymous: result.user.isAnonymous ?? false,
        })
      : null;
  }
  return {
    ...services,
    session: {
      current() {
        session ??= current();
        return session;
      },
    },
  };
}

/** Server callers get the same validation and authorization without an HTTP round trip. */
export function createServerApi(headers: Headers) {
  return createRouterClient(appRouter, { context: createApiContext(headers) });
}
