'use client';

import { parseAsInteger, useQueryStates } from 'nuqs';

/**
 * Custom hook for managing runtime filter state in the URL.
 *
 * Uses nuqs to manage runtime filter with a clean URL key.
 * Internally uses descriptive name 'runtimeLte', mapped to short 'runtime' in URL.
 * Filters movies and TV shows by maximum runtime (less than or equal to).
 *
 * @returns A tuple containing the current runtime filter state and a setter function
 * @example
 * const [{ runtimeLte }, setRuntimeFilter] = useRuntimeFilter()
 * // URL: ?runtime=90
 */
export function useRuntimeFilter() {
  return useQueryStates(
    {
      runtimeLte: parseAsInteger,
    },
    {
      urlKeys: {
        runtimeLte: 'runtime',
      },
      history: 'push',
    }
  );
}
