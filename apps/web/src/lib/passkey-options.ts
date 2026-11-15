import type { PasskeyOptions } from '@better-auth/passkey';

/** Shown by Better Auth and as the relying-party name in OS passkey prompts. */
export const APP_NAME = 'Movies';

/**
 * Passkey plugin options.
 *
 * Sign-in is usernameless (no `allowCredentials`), so only discoverable
 * credentials can ever be used: `residentKey: 'required'` keeps security keys
 * from registering credentials that could never sign in. A passkey is the sole
 * factor, so the authenticator must also verify the user (PIN or biometric).
 *
 * The plugin derives `rpID` from `baseURL` (`NEXT_PUBLIC_BASE_URL`, set per
 * Railway environment). `auth.ts` adds the allowed origins, including the
 * native Android app's signing-key origins.
 */
export const passkeyOptions = {
  rpName: APP_NAME,
  authenticatorSelection: {
    residentKey: 'required',
    userVerification: 'required',
  },
} satisfies PasskeyOptions;
