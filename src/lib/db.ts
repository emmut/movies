import { env } from '@/env';
import { drizzle } from 'drizzle-orm/neon-serverless';

export const db = drizzle(env.DATABASE_URL);
