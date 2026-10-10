export type SignInMethod = 'discord' | 'github' | 'anonymous' | 'passkey';
type User = { isAnonymous?: boolean | null };
type Sources = {
  signIn(method: SignInMethod, destination: string): Promise<{ error: unknown }>;
  current(): Promise<User | null>;
};

function completed(method: SignInMethod, user: User | null) {
  if (!user) {
    return false;
  }
  const social = method === 'discord' || method === 'github';
  // Dismissing OAuth must not treat the previous anonymous session as a success.
  if (social && user.isAnonymous) {
    return false;
  }
  return true;
}
export function createSignInFlow(sources: Sources) {
  return async function authenticate(method: SignInMethod, destination: string) {
    try {
      const result = await sources.signIn(method, destination);
      if (result.error) {
        return 'Couldn’t sign in. Please try again.';
      }
      if (!completed(method, await sources.current())) {
        return 'Sign-in was cancelled or did not finish. Please try again.';
      }
      return null;
    } catch {
      return 'Couldn’t sign in. Check your connection and try again.';
    }
  };
}
