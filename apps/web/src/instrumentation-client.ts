import posthog from 'posthog-js';

import { ENV } from '@/env';

// PostHog's recommended Next.js setup: initialize in instrumentation-client,
// with `defaults` opting into current SDK behavior — pageviews (including SPA
// history navigations) and pageleaves are captured automatically, so no
// provider or pageview component is needed.
posthog.init(ENV.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: ENV.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2026-06-25',
});
