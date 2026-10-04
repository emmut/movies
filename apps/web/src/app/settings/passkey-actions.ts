'use server';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

export async function getUserPasskeys() {
  try {
    const response = await auth.api.listPasskeys({
      headers: await headers(),
    });

    return response || [];
  } catch (error) {
    console.error('Failed to fetch user passkeys:', error);
    return [];
  }
}
