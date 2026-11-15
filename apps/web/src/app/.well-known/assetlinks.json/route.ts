import { androidFingerprintsSchema, androidPasskeyAssociation } from '@movies/config/passkeys';

import { ENV } from '@/env';

export function GET() {
  const fingerprints = androidFingerprintsSchema.parse(ENV.PASSKEY_ANDROID_FINGERPRINTS);
  if (fingerprints.length === 0) {
    return new Response(null, { status: 404 });
  }
  return Response.json(androidPasskeyAssociation(fingerprints), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
