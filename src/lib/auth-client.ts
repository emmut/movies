import { createAuthClient } from 'better-auth/react';
import { useRouter } from 'next/navigation';

const authClient = createAuthClient();

export const { useSession } = authClient;

export async function signIn() {
  const data = await authClient.signIn.social({
    provider: 'discord',
    callbackURL: '/',
    errorCallbackURL: '/',
    newUserCallbackURL: '/',
  });
}

export async function signOut() {
  const router = useRouter();

  const data = await authClient.signOut();

  router.push('/');
}
