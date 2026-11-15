import { PostHog } from 'posthog-node';

import { ENV } from '@/env';

export const posthog = new PostHog(ENV.NEXT_PUBLIC_POSTHOG_KEY, {
  host: ENV.NEXT_PUBLIC_POSTHOG_HOST,
});
