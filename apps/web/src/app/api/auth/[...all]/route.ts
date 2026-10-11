import { AuthProxyMetadataError, verifiedAuthRequest } from '@movies/auth/proxy';
import { toNextJsHandler } from 'better-auth/next-js';

import { env } from '@/env';
import { auth } from '@/lib/auth';

const handlers = toNextJsHandler(auth);

async function handle(request: Request) {
  try {
    const verified = verifiedAuthRequest(request, env.BETTER_AUTH_SECRET);
    if (request.method === 'GET') {
      return await handlers.GET(verified);
    }
    return await handlers.POST(verified);
  } catch (error) {
    if (error instanceof AuthProxyMetadataError) {
      return Response.json(
        { code: 'INVALID_AUTH_PROXY_METADATA', message: error.message },
        { status: 400 },
      );
    }
    throw error;
  }
}

export const GET = handle;
export const POST = handle;
