import { getRequest } from '@tanstack/react-start/server';

import { auth } from '@/lib/auth';

export async function getUserPasskeys() {
  try {
    const request = getRequest();
    const response = await auth.api.listPasskeys({
      headers: request.headers,
    });

    return response || [];
  } catch (error) {
    console.error('Failed to fetch user passkeys:', error);
    return [];
  }
}
