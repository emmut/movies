import 'server-only';
import type { PasskeyMetadata } from '@movies/api/passkeys';
import { headers } from 'next/headers';

import { serverAuthClient } from '@/lib/auth-server-client';

/**
 * Lists the signed-in user's passkeys with only the fields the settings page
 * shows, so credential material never reaches the client payload.
 *
 * @returns The user's passkeys, or an empty list when the lookup fails.
 */
export async function getUserPasskeys(): Promise<PasskeyMetadata[]> {
  try {
    const { data: passkeys, error } = await serverAuthClient.passkey.listUserPasskeys({
      fetchOptions: { headers: await headers() },
    });
    if (error) {
      throw new Error('Could not list passkeys', { cause: error });
    }

    return (passkeys ?? []).map((passkey) => ({
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
