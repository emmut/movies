'use client';

import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Hook that returns true after the component has mounted on the client.
 * Useful for preventing hydration mismatches when using libraries that generate
 * dynamic IDs or when content differs between server and client.
 *
 * @returns boolean indicating whether the component has mounted
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  const initIsMounted = useEffectEvent(() => {
    setIsMounted(true);
  });

  useEffect(() => {
    initIsMounted();
  }, []);

  return isMounted;
}
