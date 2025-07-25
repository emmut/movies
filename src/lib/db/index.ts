import * as authSchema from '@/db/schema/auth';
import * as listsSchema from '@/db/schema/lists';
import { env } from '@/env';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const schema = { ...authSchema, ...listsSchema };
const sql = neon(env.DATABASE_URL);
export const db = drizzle({ client: sql, schema });
