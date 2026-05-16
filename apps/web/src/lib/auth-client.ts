import { passkeyClient } from "@better-auth/passkey/client";
import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getSafeRedirectUrl } from "@movies/ui/lib/utils";

const authClient = createAuthClient({
  plugins: [anonymousClient(), passkeyClient()],
});

export const { useSession } = authClient;
export type Session = typeof authClient.$Infer.Session;
export { authClient };

export async function signOut() {
  try {
    const data = await authClient.signOut();
    if (data?.error) throw data.error;
    return data;
  } catch (error) {
    console.error("Failed to sign out:", error);
    return { error: "Failed to sign out", data: null };
  }
}

export async function signInDiscord(redirectUrl: string) {
  return authClient.signIn.social({
    provider: "discord",
    callbackURL: getSafeRedirectUrl(redirectUrl),
    errorCallbackURL: "/login?error=failed_to_login",
  });
}

export async function signInGitHub(redirectUrl: string) {
  return authClient.signIn.social({
    provider: "github",
    callbackURL: getSafeRedirectUrl(redirectUrl),
    errorCallbackURL: "/login?error=failed_to_login",
  });
}

export async function signInSettings(redirectUrl: string) {
  return authClient.signIn.social({
    provider: "discord",
    callbackURL: getSafeRedirectUrl(redirectUrl),
    errorCallbackURL: "/settings?error=failed_to_link_account",
  });
}

export async function signInGitHubSettings(redirectUrl: string) {
  return authClient.signIn.social({
    provider: "github",
    callbackURL: getSafeRedirectUrl(redirectUrl),
    errorCallbackURL: "/settings?error=failed_to_link_account",
  });
}

export async function addPasskey(name = "My Passkey") {
  try {
    const data = await authClient.passkey.addPasskey({ name });
    if (data?.error) throw data.error;
    return { error: false, data };
  } catch (error) {
    console.error("Failed to add passkey:", error);
    return { error: true, data: null };
  }
}

export async function signInPasskey(_email: string, autoFill = false) {
  try {
    const data = await authClient.signIn.passkey({ autoFill });
    if (data?.error) throw data.error;
    return data;
  } catch (error) {
    console.warn("Failed to sign in with passkey:", error);
    return { error, data: null };
  }
}

export async function signInAnonymous() {
  try {
    const data = await authClient.signIn.anonymous();
    if (data?.error) throw data.error;
    return data;
  } catch (error) {
    console.error("Failed to sign in anonymously:", error);
    return { error: "Failed to sign in anonymously", data: null };
  }
}
