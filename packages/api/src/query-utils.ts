import { createTanstackQueryUtils } from '@orpc/tanstack-query';

import type { AppRouterClient } from './router';

export function createApiQueryUtils(client: AppRouterClient) {
  return createTanstackQueryUtils(client);
}
