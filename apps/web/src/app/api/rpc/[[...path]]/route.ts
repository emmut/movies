import { appRouter } from '@movies/api/router';
import { RPCHandler } from '@orpc/server/fetch';

import { createApiContext } from '@/lib/api-server';

const handler = new RPCHandler(appRouter);

async function handle(request: Request): Promise<Response> {
  const context = createApiContext(request.headers);
  const result = await handler.handle(request, { prefix: '/api/rpc', context });
  if (!result.matched) {
    return new Response('Not found', { status: 404 });
  }
  return result.response;
}

export const GET = handle;
export const POST = handle;
