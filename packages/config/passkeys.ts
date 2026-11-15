import { z } from 'zod';

export const NATIVE_APP_ID = 'com.movies.app';
export const passkeyDomainSchema = z
  .string()
  .max(253)
  .regex(/^(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/)
  .transform((value) => value.toLowerCase());
export const appleTeamIdSchema = z.string().regex(/^[A-Z0-9]{10}$/);
const fingerprintSchema = z
  .string()
  .transform((value) => value.trim().replaceAll(':', '').toUpperCase())
  .pipe(z.string().regex(/^[A-F0-9]{64}$/))
  .transform((value) => value.match(/.{2}/g)!.join(':'));
export const androidFingerprintsSchema = z
  .preprocess((value) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
    return value ?? [];
  }, z.array(fingerprintSchema))
  .transform((values) => [...new Set(values)]);

export function applePasskeyAssociation(teamId: string) {
  return { webcredentials: { apps: [appleTeamIdSchema.parse(teamId) + '.' + NATIVE_APP_ID] } };
}
export function androidPasskeyAssociation(fingerprints: string[]) {
  const validated = androidFingerprintsSchema.parse(fingerprints);
  return [
    {
      relation: ['delegate_permission/common.get_login_creds'],
      target: {
        namespace: 'android_app',
        package_name: NATIVE_APP_ID,
        sha256_cert_fingerprints: validated,
      },
    },
  ];
}
