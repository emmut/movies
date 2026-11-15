import 'server-only';
import { appRouter, type AppServices, type AppContext } from '@movies/api/router';
import { AUTH_NOT_CONFIGURED } from '@movies/api/session';
import { verifiedProxyIp } from '@movies/auth/proxy';
import { isLocalBrowserOrigin } from '@movies/config/native-auth';
import { RPCHandler } from '@orpc/server/fetch';
import type { AuthGateway } from '@server/auth-gateway';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

function localOrigin(origin: string) {
  return isLocalBrowserOrigin(origin) ? origin : '';
}

type AppOptions = {
  origin?: string;
  middleware?: MiddlewareHandler[];
  auth?: AuthGateway;
  clientIp?: (context: Context) => string;
  rpcProxySecret?: string;
  onMutation?: AppContext['onMutation'];
};

export function createApp(services: AppServices, options: AppOptions = {}) {
  const { origin, middleware = [], auth, clientIp, rpcProxySecret, onMutation } = options;
  function rpcClientIp(context: Context) {
    const forwarded = rpcProxySecret ? verifiedProxyIp(context.req.raw, rpcProxySecret) : undefined;
    return forwarded ?? clientIp?.(context);
  }
  const app = new Hono();
  for (const use of middleware) {
    app.use(use);
  }
  const handler = new RPCHandler(appRouter);
  const corsOrigin = origin ?? localOrigin;
  app.use(
    '/rpc/*',
    cors({
      origin: corsOrigin,
      allowMethods: ['POST', 'OPTIONS'],
      credentials: true,
      allowHeaders: ['Content-Type'],
    }),
  );
  app.use(
    '/api/auth/*',
    cors({
      origin: corsOrigin,
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
  app.on('POST', '/rpc/*', async (c) => {
    const result = await handler.handle(c.req.raw, {
      prefix: '/rpc',
      context: {
        ...services,
        onMutation,
        session: auth
          ? { current: () => auth.current(c.req.raw.headers, rpcClientIp(c)) }
          : undefined,
      },
    });
    return result.matched ? result.response : c.notFound();
  });
  app.get('/health', (c) => c.json({ status: 'ok' }));
  return app;
}
