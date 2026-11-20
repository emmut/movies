import 'server-only';
import { createDatabase } from '@movies/services/database';
import { ENV } from '@server/env';

/** Auth and product services share one bounded connection pool per server process. */
export const database = createDatabase(ENV.DATABASE_URL, ENV.DB_POOL_MAX);
