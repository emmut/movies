import 'server-only';
import { appRouter, type HomeService } from '@movies/api/router';
import { RPCHandler } from '@orpc/server/fetch';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Development browsers may use localhost or the computer's private LAN address.
const LOCAL_ORIGIN =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d{1,5})?$/;
function localOrigin(origin: string) {
  return LOCAL_ORIGIN.test(origin) ? origin : '';
}

export function createApp(home: HomeService, origin?: string) {
  const app = new Hono();
  const handler = new RPCHandler(appRouter);
  app.use(
    '/rpc/*',
    cors({
      origin: origin ?? localOrigin,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
    }),
  );
  app.all('/rpc/*', async (c) => {
    const result = await handler.handle(c.req.raw, { prefix: '/rpc', context: { home } });
    return result.matched ? result.response : c.notFound();
  });
  app.get('/health', (c) => c.json({ status: 'ok' }));
  return app;
}
