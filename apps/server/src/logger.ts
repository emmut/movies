import 'server-only';
import type { MiddlewareHandler } from 'hono';
import { pino, type Logger, type LoggerOptions } from 'pino';

// Structured logger factory. Pretty output is a dev-only transport; production
// stays on newline-delimited JSON. Env wiring lives in index.ts so tests can
// keep injecting their own destination.
export function createLogger(level: LoggerOptions['level'], pretty: boolean): Logger {
  if (!pretty) {
    return pino({ level });
  }
  return pino({
    level,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        // NB: singleLine + hideObject together make pino-pretty drop newlines
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        hideObject: true,
        // Next.js-style request lines: `GET /health 200 in 3ms`; other logs show msg
        messageFormat:
          '{if method}{method} {path} {status} in {durationMs}ms{end}{if msg}{msg}{end}',
      },
    },
  });
}

// Structured request logging. Level lives on the Logger passed in, so this
// module stays env-free and tests can inject a silent or in-memory logger.
export function createRequestLogger(logger: Logger): MiddlewareHandler {
  return async function requestLogger(c, next) {
    const start = performance.now();
    await next();
    logger.info({
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Math.round(performance.now() - start),
    });
  };
}
