import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

import { env } from '@movies/env/web';

export type PostHogClientProviderProps = {
  children: React.ReactNode;
};

export function PostHogClientProvider({ children }: PostHogClientProviderProps) {
  useEffect(() => {
    if (env.VITE_POSTHOG_KEY) {
      posthog.init(env.VITE_POSTHOG_KEY, {
        api_host: env.VITE_POSTHOG_HOST,
        capture_pageleave: true,
        capture_pageview: false,
      });
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
