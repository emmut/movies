import 'server-only';
import { appRouter, type AppServices } from '@movies/api/router';
import { AUTH_NOT_CONFIGURED } from '@movies/api/session';
import { isLocalBrowserOrigin } from '@movies/config/native-auth';
import { RPCHandler } from '@orpc/server/fetch';
import type { AuthGateway } from '@server/auth-gateway';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

function localOrigin(origin: string) {
  return isLocalBrowserOrigin(origin) ? origin : '';
}

export function createApp(
  services: AppServices,
  origin?: string,
  middleware: MiddlewareHandler[] = [],
  auth?: AuthGateway,
  clientIp?: (context: Context) => string,
) {
  const app = new Hono();
  for (const use of middleware) {
    app.use(use);
  }
  const handler = new RPCHandler(appRouter);
  app.use(
    '/rpc/*',
    cors({
      origin: origin ?? localOrigin,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      allowHeaders: ['Content-Type'],
    }),
  );
  app.use(
    '/api/auth/*',
    cors({
      origin: origin ?? localOrigin,
      credentials: true,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'expo-origin'],
    }),
  );
  app.on(['GET', 'POST'], '/api/auth/*', async (c) => {
    if (!auth) {
      return c.json(
        { code: AUTH_NOT_CONFIGURED, message: 'Authentication is not configured' },
        503,
      );
    }
    try {
      return await auth.handle(c.req.raw, clientIp?.(c));
    } catch {
      return c.json({ message: 'Could not reach authentication service' }, 502);
    }
  });
  app.all('/rpc/*', async (c) => {
    const result = await handler.handle(c.req.raw, {
      prefix: '/rpc',
      context: {
        ...services,
        session: auth
          ? { current: () => auth.current(c.req.raw.headers, clientIp?.(c)) }
          : undefined,
      },
    });
    return result.matched ? result.response : c.notFound();
  });
  app.get('/health', (c) => c.json({ status: 'ok' }));
  return app;
}
