import 'server-only';
import { TmdbRequestError, type TmdbFetch } from '@movies/api/tmdb-fetch';
import { ORPCError } from '@orpc/server';
import { z } from 'zod';

/** Validate full resources before returning them through either API host. */
export function createResourceReader(fetchTmdb: TmdbFetch) {
  return async function readResource<T>(path: string, schema: z.ZodType<T>, expectedId: number) {
    try {
      const value = await fetchTmdb<unknown>(path);
      if (
        typeof value === 'object' &&
        value !== null &&
        Object.hasOwn(value, 'id') &&
        Reflect.get(value, 'id') !== expectedId
      ) {
        throw new Error('Upstream resource identifier mismatch');
      }
      return schema.parse(value);
    } catch (error) {
      if (error instanceof TmdbRequestError && error.status === 404) {
        throw new ORPCError('NOT_FOUND');
      }
      throw error;
    }
  };
}
