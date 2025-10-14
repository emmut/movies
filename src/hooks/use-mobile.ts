import { useEffect, useEffectEvent, useState } from 'react';

const MOBILE_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  const updateIsMobile = useEffectEvent(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  });

  useEffect(() => {
    const controller = new AbortController();
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener('change', updateIsMobile, {
      signal: controller.signal,
    });
    updateIsMobile();
    return () => controller.abort();
  }, []);

  return !!isMobile;
}
