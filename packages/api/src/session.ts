import { z } from 'zod';

export const sessionUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string(),
  image: z.string().url().nullable(),
  isAnonymous: z.boolean(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;
