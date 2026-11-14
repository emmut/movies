'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a value that only updates after it has stopped changing for the
 * given delay. Used to throttle search-as-you-type requests.
 *
 * @param value - The rapidly changing input value
 * @param delayMs - How long the value must be stable before propagating
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}
