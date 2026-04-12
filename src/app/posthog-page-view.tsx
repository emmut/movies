'use client';

import { useLocation } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

export function SuspendedPostHogPageView() {
  const { pathname, search } = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      const url = window.origin + pathname + (search ? search : '');
      posthog.capture('$pageview', { $current_url: url });
    }
  }, [pathname, search, posthog]);

  return null;
}
