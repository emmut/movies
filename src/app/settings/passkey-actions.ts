'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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