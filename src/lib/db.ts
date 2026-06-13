import { drizzle } from 'drizzle-orm/node-postgres';

import { env } from '@/env';

export const db = drizzle({
  connection: {
    connectionString: env.DATABASE_URL,
    // Scale-to-zero (Railway) + autosuspend (Neon): drop idle connections so a
    // resumed container reconnects cleanly instead of reusing a dead socket.
    idleTimeoutMillis: 10_000,
    max: 10,
  },
});
