import 'server-only';
import type { PasskeyMetadata } from '@movies/api/passkeys';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

/**
 * Lists the signed-in user's passkeys with only the fields the settings page
 * shows, so credential material never reaches the client payload.
 *
 * @returns The user's passkeys, or an empty list when the lookup fails.
 */
export async function getUserPasskeys(): Promise<PasskeyMetadata[]> {
  try {
    const passkeys = await auth.api.listPasskeys({
      headers: await headers(),
    });

    return passkeys.map((passkey) => ({
      id: passkey.id,
      name: passkey.name ?? null,
      deviceType: passkey.deviceType,
      createdAt: passkey.createdAt,
    }));
  } catch (error) {
    console.error('Failed to fetch user passkeys:', error);
    return [];
  }
}
