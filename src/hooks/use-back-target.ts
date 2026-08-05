import { usePathname } from 'next/navigation';

import { backTargetKey, sanitizeBackHref } from '@/lib/back-target';

import { useSessionStorageValue } from './use-session-storage-value';

const DEFAULT_BACK_HREF = '/discover';

/**
 * The back target recorded for the current page (see `@/lib/back-target`),
 * as reactive state: /discover until hydration and for direct visits, the
 * validated stored URL once the client store is readable.
 */
export function useBackTarget(): string {
  const pathname = usePathname();
  const stored = useSessionStorageValue(backTargetKey(pathname));

  return sanitizeBackHref(stored) ?? DEFAULT_BACK_HREF;
}
