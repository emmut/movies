export type PasskeyFailure = 'cancelled' | 'already-registered' | 'failed';

export type PasskeyResult = { ok: true } | { ok: false; reason: PasskeyFailure };

// `@simplewebauthn/browser` reports a dismissed or timed-out OS prompt
// (`NotAllowedError`) as a pass-through, and an aborted ceremony separately.
const CANCELLED_CODES = new Set(['ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY', 'ERROR_CEREMONY_ABORTED']);

/**
 * Sorts a Better Auth passkey error into the outcomes the UI distinguishes.
 */
export function classifyPasskeyError(error: unknown): PasskeyFailure {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;

  if (typeof code !== 'string') {
    return 'failed';
  }
  if (CANCELLED_CODES.has(code)) {
    return 'cancelled';
  }
  if (code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED') {
    return 'already-registered';
  }
  return 'failed';
}

/**
 * The toast text for a failed passkey operation, or `null` when the user
 * dismissed the prompt themselves and no message is needed.
 */
export function passkeyFailureMessage(reason: PasskeyFailure, fallback: string) {
  switch (reason) {
    case 'cancelled':
      return null;
    case 'already-registered':
      return 'This device already has a passkey for your account.';
    case 'failed':
      return fallback;
  }
}
