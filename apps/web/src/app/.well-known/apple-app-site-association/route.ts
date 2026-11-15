import { applePasskeyAssociation } from '@movies/config/passkeys';

import { ENV } from '@/env';

export function GET() {
  if (!ENV.PASSKEY_APPLE_TEAM_ID) {
    return new Response(null, { status: 404 });
  }
  return Response.json(applePasskeyAssociation(ENV.PASSKEY_APPLE_TEAM_ID), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
