import 'server-only';
import { authProxyHeaders } from '@movies/auth/proxy';

import { ENV } from '@/env';

/** Only explicitly trusted ingress metadata is signed; caller identity headers never cross. */
export function rpcProxyHeaders(
  source: Headers,
  method: string,
  path: string,
  payloadHeaders: Headers = source,
) {
  const headers = new Headers();
  for (const name of ['cookie', 'content-type', 'accept']) {
    const value = name === 'cookie' ? source.get(name) : payloadHeaders.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  if (headers.has('cookie') && ENV.RPC_IP_SOURCE === 'railway') {
    const signed = authProxyHeaders(
      ENV.BETTER_AUTH_SECRET,
      source.get('x-real-ip') ?? '',
      method,
      path,
    );
    signed.forEach((value, name) => headers.set(name, value));
  }
  return headers;
}
