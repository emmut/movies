'use client';
import { SuspendedPostHogPageView } from '@/app/posthog-page-view';
import { env } from '@/env';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export type PHProviderProps = {
  children: React.ReactNode;
};

export function PHProvider({ children }: PHProviderProps) {
  useEffect(() => {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    });
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PostHogProvider>
  );
}
