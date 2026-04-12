import { getRequest } from '@tanstack/react-start/server';
import { cache } from 'react';

import { auth } from './auth';

export const getSession = cache(async () => {
  const request = getRequest();
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return session;
});

export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}
