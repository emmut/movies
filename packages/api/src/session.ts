import { z } from 'zod';

export const AUTH_NOT_CONFIGURED = 'AUTH_NOT_CONFIGURED';
const unavailableAuthSchema = z.object({
  status: z.literal(503),
  code: z.literal(AUTH_NOT_CONFIGURED),
});

/** Only an explicitly catalog-only host permits public fallback after a session-read error. */
export function isAuthNotConfigured(error: unknown) {
  return unavailableAuthSchema.safeParse(error).success;
}

export const sessionUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string(),
  image: z.string().url().nullable(),
  isAnonymous: z.boolean(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;
