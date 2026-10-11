import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

export const AUTH_CLIENT_IP_HEADER = 'x-movies-auth-client-ip';
const SIGNATURE_HEADER = 'x-movies-auth-ip-signature';
const TIMESTAMP_HEADER = 'x-movies-auth-ip-time';
const MAX_CLOCK_SKEW = 30_000;

export class AuthProxyMetadataError extends Error {
  constructor() {
    super('Invalid authentication proxy metadata');
    this.name = 'AuthProxyMetadataError';
  }
}

function signature(secret: string, ip: string, time: string, method: string, path: string) {
  const payload = JSON.stringify({ ip, time, method, path });
  return createHmac('sha256', secret)
    .update('movies-auth-ip-v1\n' + payload)
    .digest();
}

/** The host supplies trusted transport/ingress metadata, never a caller-chosen IP field. */
export function authProxyHeaders(
  secret: string,
  ip: string,
  method: string,
  path: string,
  now = Date.now(),
) {
  if (!isIP(ip)) {
    throw new AuthProxyMetadataError();
  }
  const time = String(now);
  return new Headers({
    [AUTH_CLIENT_IP_HEADER]: ip,
    [TIMESTAMP_HEADER]: time,
    [SIGNATURE_HEADER]: signature(secret, ip, time, method, path).toString('hex'),
  });
}

function verify(request: Request, secret: string, now: number) {
  const ip = request.headers.get(AUTH_CLIENT_IP_HEADER) ?? '';
  const time = request.headers.get(TIMESTAMP_HEADER) ?? '';
  const provided = request.headers.get(SIGNATURE_HEADER) ?? '';
  const timestamp = Number(time);
  if (
    !isIP(ip) ||
    !Number.isSafeInteger(timestamp) ||
    Math.abs(now - timestamp) > MAX_CLOCK_SKEW ||
    !/^[a-f0-9]{64}$/.test(provided)
  ) {
    throw new AuthProxyMetadataError();
  }
  const expected = signature(secret, ip, time, request.method, new URL(request.url).pathname);
  if (!timingSafeEqual(expected, Buffer.from(provided, 'hex'))) {
    throw new AuthProxyMetadataError();
  }
  return ip;
}

/** Strip caller metadata; only a verified gateway signature may populate Better Auth's IP key. */
export function verifiedAuthRequest(request: Request, secret: string, now = Date.now()) {
  const headers = new Headers(request.headers);
  headers.delete(AUTH_CLIENT_IP_HEADER);
  headers.delete(SIGNATURE_HEADER);
  headers.delete(TIMESTAMP_HEADER);
  if (request.headers.has(SIGNATURE_HEADER) || request.headers.has(TIMESTAMP_HEADER)) {
    headers.set(AUTH_CLIENT_IP_HEADER, verify(request, secret, now));
  }
  return new Request(request, { headers });
}
