import { applePasskeyAssociation } from '@movies/config/passkeys';

import { env } from '@/env';

export function GET() {
  if (!env.PASSKEY_APPLE_TEAM_ID) {
    return new Response(null, { status: 404 });
  }
  return Response.json(applePasskeyAssociation(env.PASSKEY_APPLE_TEAM_ID), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
