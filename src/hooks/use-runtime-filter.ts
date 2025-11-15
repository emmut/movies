'use client';

import { parseAsInteger, useQueryStates } from 'nuqs';

/**
 * Custom hook for managing runtime filter state in the URL.
 *
 * Uses nuqs to manage the with_runtime_lte query parameter,
 * which filters movies and TV shows by maximum runtime (less than or equal to).
 *
 * @returns A tuple containing the current runtime filter state and a setter function
 */
export function useRuntimeFilter() {
  return useQueryStates(
    {
      with_runtime_lte: parseAsInteger,
    },
    {
      history: 'push',
    }
  );
}
