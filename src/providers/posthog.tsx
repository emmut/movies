'use client';
import { useEffect, useState } from 'react';

import { SuspendedPostHogPageView } from '@/app/posthog-page-view';
import { env } from '@/env';

import type { PostHog } from 'posthog-js';

export type PostHogClientProviderProps = {
  children: React.ReactNode;
};

/**
 * Loads and initializes posthog-js after hydration, so the analytics bundle
 * never sits in any route's first-load JS.
 */
export function PostHogClientProvider({ children }: PostHogClientProviderProps) {
  const [client, setClient] = useState<PostHog | null>(null);

  useEffect(() => {
    let cancelled = false;

    import('posthog-js')
      .then(({ default: posthog }) => {
        if (cancelled) {
          return;
        }

        posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
          api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
          capture_pageleave: true,
          capture_pageview: false,
        });
        setClient(posthog);
      })
      .catch(function logPosthogLoadFailure(error: unknown) {
        // Analytics only — never let a failed chunk load surface to the user.
        console.error('Failed to load posthog-js:', error);
      });

    return function cancel() {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SuspendedPostHogPageView client={client} />
      {children}
    </>
  );
}
