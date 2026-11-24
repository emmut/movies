import 'server-only';
import { appRouter, type AppServices, type AppContext } from '@movies/api/router';
import { AUTH_NOT_CONFIGURED } from '@movies/api/session';
import type { Auth } from '@movies/auth';
import { AuthProxyMetadataError } from '@movies/auth/proxy';
import { isLocalBrowserOrigin } from '@movies/config/native-auth';
import { RPCHandler } from '@orpc/server/fetch';
import { authIngressHeaders } from '@server/auth-ingress';
import { createContext } from '@server/context';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

function localOrigin(origin: string) {
  return isLocalBrowserOrigin(origin) ? origin : '';
}

type AppOptions = {
  origin?: string;
  middleware?: MiddlewareHandler[];
  auth?: Pick<Auth, 'handler' | 'api'>;
  clientIp?: (context: Context) => string;
  authProxySecret?: string;
  onMutation?: AppContext['onMutation'];
};

export function createApp(services: AppServices, options: AppOptions = {}) {
  const { origin, middleware = [], auth, clientIp, authProxySecret, onMutation } = options;
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
      return await auth.handler(
        new Request(c.req.raw, {
          headers: authIngressHeaders(c.req.raw, authProxySecret, () => clientIp?.(c)),
        }),
      );
    } catch (error) {
      if (error instanceof AuthProxyMetadataError) {
        return c.json({ code: 'INVALID_AUTH_PROXY_METADATA', message: error.message }, 400);
      }
      throw error;
    }
  });
  app.on('POST', '/rpc/*', async (c) => {
    const result = await handler.handle(c.req.raw, {
      prefix: '/rpc',
      context: createContext(services, c.req.raw.headers, auth, onMutation),
    });
    return result.matched ? result.response : c.notFound();
  });
  app.get('/health', (c) => c.json({ status: 'ok' }));
  return app;
}
