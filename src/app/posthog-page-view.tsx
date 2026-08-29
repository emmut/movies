'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import type { PostHog } from 'posthog-js';

type PostHogPageViewProps = {
  client: PostHog | null;
};

function PostHogPageView({ client }: PostHogPageViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track pageviews
  useEffect(() => {
    if (pathname && client) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }

      client.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams, client]);

  return null;
}

// Wrap this in Suspense to avoid the `useSearchParams` usage above
// from de-opting the whole app into client-side rendering
// See: https://nextjs.org/docs/messages/deopted-into-client-rendering
export function SuspendedPostHogPageView({ client }: PostHogPageViewProps) {
  return (
    <Suspense fallback={null}>
      <PostHogPageView client={client} />
    </Suspense>
  );
}
