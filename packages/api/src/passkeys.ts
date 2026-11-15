import { z } from 'zod';

import { hasErrorCode } from './errors';

export const passkeyNameSchema = z
  .string()
  .trim()
  .min(1, 'Please enter a name for your passkey.')
  .max(100, 'Use 100 characters or fewer.');
export const passkeyMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().nullish(),
  createdAt: z.coerce.date().nullish(),
  deviceType: z.string(),
});
export const passkeyListSchema = z.array(passkeyMetadataSchema);
export type PasskeyMetadata = z.infer<typeof passkeyMetadataSchema>;

export const passkeyRegistrationOptionsSchema = z
  .object({
    challenge: z.string().min(1),
    rp: z.object({ id: z.string().min(1), name: z.string() }).passthrough(),
    user: z
      .object({ id: z.string().min(1), name: z.string(), displayName: z.string() })
      .passthrough(),
    pubKeyCredParams: z.array(z.object({ type: z.literal('public-key'), alg: z.number().int() })),
  })
  .passthrough();
export const passkeyAuthenticationOptionsSchema = z
  .object({
    challenge: z.string().min(1),
    rpId: z.string().min(1),
  })
  .passthrough();
export const passkeyCredentialSchema = z
  .object({
    id: z.string().min(1),
    rawId: z.string().min(1),
    type: z.literal('public-key'),
    response: z.record(z.string(), z.unknown()),
    clientExtensionResults: z.unknown().optional(),
  })
  .passthrough();
export type PasskeyRegistrationOptions = z.infer<typeof passkeyRegistrationOptionsSchema>;
export type PasskeyAuthenticationOptions = z.infer<typeof passkeyAuthenticationOptionsSchema>;

export function formatPasskeyDate(value: Date | null | undefined) {
  if (!value || !Number.isFinite(value.getTime())) {
    return 'Unknown';
  }
  return value.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Human label for WebAuthn's credential device type: synced passkeys are
 * `multiDevice`, device-bound ones (e.g. most security keys) `singleDevice`.
 */
export function deviceTypeLabel(deviceType: string) {
  if (deviceType === 'multiDevice') {
    return 'Synced';
  }
  if (deviceType === 'singleDevice') {
    return 'This device only';
  }
  return deviceType;
}

export type PasskeyFailure = 'cancelled' | 'already-registered' | 'no-credentials' | 'failed';
export type PasskeyResult = { ok: true } | { ok: false; reason: PasskeyFailure };

/** Codes both clients produce. Browser codes come from `@simplewebauthn/browser`; `PASSKEY_*` from the native ceremony. */
export const PASSKEY_ERROR = {
  cancelled: 'PASSKEY_CANCELLED',
  alreadyRegistered: 'PASSKEY_ALREADY_REGISTERED',
  noCredentials: 'PASSKEY_NO_CREDENTIALS',
} as const;

// A dismissed or timed-out OS prompt surfaces as `NotAllowedError`, which the
// browser SDK passes through; an aborted ceremony has its own code.
const CANCELLED_CODES = [
  PASSKEY_ERROR.cancelled,
  'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
  'ERROR_CEREMONY_ABORTED',
];
const ALREADY_REGISTERED_CODES = [
  PASSKEY_ERROR.alreadyRegistered,
  'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED',
];

/** Sorts a passkey error from either client into the outcomes the UI distinguishes. */
export function classifyPasskeyError(error: unknown): PasskeyFailure {
  if (hasErrorCode(error, ...CANCELLED_CODES)) {
    return 'cancelled';
  }
  if (hasErrorCode(error, ...ALREADY_REGISTERED_CODES)) {
    return 'already-registered';
  }
  if (hasErrorCode(error, PASSKEY_ERROR.noCredentials)) {
    return 'no-credentials';
  }
  return 'failed';
}

/**
 * The message for a failed passkey operation, or `null` when the user
 * dismissed the prompt themselves and no message is needed.
 */
export function passkeyFailureMessage(reason: PasskeyFailure, fallback: string) {
  switch (reason) {
    case 'cancelled':
      return null;
    case 'already-registered':
      return 'This device already has a passkey for your account.';
    case 'no-credentials':
      return 'No passkey for Movies was found on this device.';
    case 'failed':
      return fallback;
  }
}
