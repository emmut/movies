import { classifyPasskeyError, passkeyFailureMessage } from '@movies/api/passkeys';

export type SignInMethod = 'discord' | 'github' | 'anonymous' | 'passkey';
type User = { isAnonymous?: boolean | null };
type Sources<Method extends SignInMethod> = {
  signIn(method: Method, destination: string): Promise<{ error: unknown }>;
  current(): Promise<User | null>;
};

/**
 * `dismissed` means the user closed the OS passkey prompt themselves: the
 * screen stays as it was, with no error and no navigation.
 */
export type SignInOutcome =
  | { status: 'signed-in' }
  | { status: 'dismissed' }
  | { status: 'failed'; message: string };

function completed(method: SignInMethod, user: User | null) {
  if (!user) {
    return false;
  }
  // Dismissed credentials must not treat the previous anonymous session as a success.
  if (method !== 'anonymous' && user.isAnonymous) {
    return false;
  }
  return true;
}

const defaultMessages = {
  failed: 'Couldn’t sign in. Please try again.',
  cancelled: 'Sign-in was cancelled or did not finish. Please try again.',
  network: 'Couldn’t sign in. Check your connection and try again.',
};

function failed(message: string): SignInOutcome {
  return { status: 'failed', message };
}

function errorOutcome(method: SignInMethod, error: unknown, fallback: string): SignInOutcome {
  if (method !== 'passkey') {
    return failed(fallback);
  }
  const message = passkeyFailureMessage(classifyPasskeyError(error), fallback);
  if (message === null) {
    return { status: 'dismissed' };
  }
  return failed(message);
}

export function createSignInFlow<Method extends SignInMethod>(
  sources: Sources<Method>,
  messages = defaultMessages,
) {
  return async function authenticate(method: Method, destination: string): Promise<SignInOutcome> {
    try {
      const result = await sources.signIn(method, destination);
      if (result.error) {
        return errorOutcome(method, result.error, messages.failed);
      }
      if (!completed(method, await sources.current())) {
        return failed(messages.cancelled);
      }
      return { status: 'signed-in' };
    } catch {
      return failed(messages.network);
    }
  };
}
