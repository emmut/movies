/** Browser preview origins are admitted only during local development. */
export function isLocalBrowserOrigin(origin: string) {
  return /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d{1,5})?$/.test(
    origin,
  );
}
export function nativeTrustedOrigins(development: boolean, origin?: string | null) {
  const origins = ['movies://', 'movies://*'];
  if (development) {
    origins.push('exp://', 'exp://**');
    if (origin && isLocalBrowserOrigin(origin)) {
      origins.push(origin);
    }
  }
  return origins;
}
