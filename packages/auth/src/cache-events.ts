import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

export function cacheEventHeaders(body: string, secret: string, now = Date.now()) {
  const timestamp = String(now);
  const signature = createHmac('sha256', secret)
    .update(`movies-cache-event-v1\n${timestamp}\n${body}`)
    .digest('hex');
  return {
    'content-type': 'application/json',
    'x-cache-time': timestamp,
    'x-cache-signature': signature,
  };
}

/** Authenticate the exact payload; public callers cannot choose accounts to invalidate. */
export function verifyCacheEvent(body: string, headers: Headers, secret: string, now = Date.now()) {
  const time = Number(headers.get('x-cache-time'));
  const provided = headers.get('x-cache-signature') ?? '';
  if (
    !Number.isSafeInteger(time) ||
    Math.abs(now - time) > 30_000 ||
    !/^[a-f0-9]{64}$/.test(provided)
  ) {
    return false;
  }
  const expected = cacheEventHeaders(body, secret, time)['x-cache-signature'];
  return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
}
