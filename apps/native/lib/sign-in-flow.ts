export type SignInMethod = 'discord' | 'github' | 'anonymous' | 'passkey';
type User = { isAnonymous?: boolean | null };
type Sources<Method extends SignInMethod> = {
  signIn(method: Method, destination: string): Promise<{ error: unknown }>;
  current(): Promise<User | null>;
};

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
export function createSignInFlow<Method extends SignInMethod>(
  sources: Sources<Method>,
  messages = defaultMessages,
) {
  return async function authenticate(method: Method, destination: string) {
    try {
      const result = await sources.signIn(method, destination);
      if (result.error) {
        return messages.failed;
      }
      if (!completed(method, await sources.current())) {
        return messages.cancelled;
      }
      return null;
    } catch {
      return messages.network;
    }
  };
}
