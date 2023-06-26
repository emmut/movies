import { env } from 'process';

export const baseUrl =
  env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '';
