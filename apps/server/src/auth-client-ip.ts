import 'server-only';
import { isIP } from 'node:net';

/** Railway mode is an explicit deployment trust contract for public HTTP ingress. */
export function authClientIp(source: 'socket' | 'railway', headers: Headers, peer?: string) {
  const candidate = source === 'railway' ? headers.get('x-real-ip') : peer;
  if (!candidate || !isIP(candidate)) {
    throw new Error('Trusted authentication client IP is unavailable');
  }
  return candidate;
}
