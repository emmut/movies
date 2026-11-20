import 'server-only';
import { AUTH_CLIENT_IP_HEADER, verifiedProxyIp } from '@movies/auth/proxy';

/** Only the ingress peer or a signed web proxy can assert the rate-limit IP. */
export function authIngressHeaders(
  request: Request,
  secret?: string,
  clientIp?: () => string | undefined,
) {
  const forwarded = secret ? verifiedProxyIp(request, secret) : undefined;
  const headers = new Headers(request.headers);
  for (const name of [
    AUTH_CLIENT_IP_HEADER,
    'x-movies-auth-ip-signature',
    'x-movies-auth-ip-time',
    'x-real-ip',
    'x-forwarded-for',
  ]) {
    headers.delete(name);
  }
  const ip = forwarded ?? clientIp?.();
  if (ip) {
    headers.set(AUTH_CLIENT_IP_HEADER, ip);
  }
  return headers;
}
