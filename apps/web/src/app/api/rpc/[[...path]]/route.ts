import { appRouter } from '@movies/api/router';
import { RPCHandler } from '@orpc/server/fetch';

import { invalidateApiMutation } from '@/lib/api-cache-invalidation';
import { createApiContext } from '@/lib/api-server';

const handler = new RPCHandler(appRouter);

async function handle(request: Request) {
  const context = createApiContext(request.headers);
  const path = new URL(request.url).pathname.replace('/api/rpc', '');
  const mutation =
    /^\/(customLists\/(create|update|delete|add|remove|move|moveItem)|systemLists\/(toggle|move)|preferences\/(setRegion|setProviders))$/.test(
      path,
    );
  const body = mutation
    ? await request
        .clone()
        .json()
        .catch(() => null)
    : null;
  const result = await handler.handle(request, { prefix: '/api/rpc', context });
  if (mutation && result.matched && result.response.ok) {
    await invalidateApiMutation(path, body?.json ?? {}, context);
  }
  return result.matched ? result.response : new Response('Not found', { status: 404 });
}
export async function GET(request: Request) {
  return handle(request);
}
export async function POST(request: Request) {
  return handle(request);
}
