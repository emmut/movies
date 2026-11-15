import { appRouter } from '@movies/api/router';
import { RPCHandler } from '@orpc/server/fetch';

import { createApiContext } from '@/lib/api-server';

const handler = new RPCHandler(appRouter);

async function handle(request: Request) {
  const context = createApiContext(request.headers);
  const result = await handler.handle(request, { prefix: '/api/rpc', context });
  return result.matched ? result.response : new Response('Not found', { status: 404 });
}
export async function GET(request: Request) {
  return handle(request);
}
export async function POST(request: Request) {
  return handle(request);
}
