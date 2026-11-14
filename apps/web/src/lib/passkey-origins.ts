import 'server-only';
import { androidFingerprintsSchema } from '@movies/config/passkeys';

/** OS assertions use HTTPS on iOS and the signed app's certificate hash on Android. */
export function passkeyOrigins(baseUrl: string, fingerprints: unknown, development: boolean) {
  const base = new URL(baseUrl);
  const origins = [base.origin];
  for (const fingerprint of androidFingerprintsSchema.parse(fingerprints)) {
    const hash = Buffer.from(fingerprint.replaceAll(':', ''), 'hex').toString('base64url');
    origins.push('android:apk-key-hash:' + hash);
  }
  if (development && base.hostname === 'localhost') {
    for (const port of [3000, 3001, 8081, 8082, 8083]) {
      origins.push('http://localhost:' + port);
    }
  }
  return [...new Set(origins)];
}
