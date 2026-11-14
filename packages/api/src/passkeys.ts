import { z } from 'zod';

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
