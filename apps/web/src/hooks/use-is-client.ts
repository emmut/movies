import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Hook to determine if code is running on the client side.
 * Prevents hydration mismatches when accessing browser APIs like window.
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  const updateIsClient = useEffectEvent(() => {
    setIsClient(true);
  });

  useEffect(() => {
    updateIsClient();
  }, []);

  return isClient;
}
