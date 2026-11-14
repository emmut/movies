import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Where signed-out visitors to settings sign in, returning to settings afterwards. */
export const SETTINGS_LOGIN_HREF = '/login?redirect_url=%2Fmore%2Fsettings';

export function isUnauthorized(error: Error | null) {
  if (!error || !('code' in error)) {
    return false;
  }
  return error.code === 'UNAUTHORIZED';
}

/**
 * Applies the confirmed response and clears the draft. Shared mutation hooks
 * own account invalidation; doing it again here would refetch twice.
 */
export function commitSavedSetting(
  client: QueryClient,
  queryKey: QueryKey,
  result: unknown,
  clearDraft: () => void,
) {
  client.setQueryData(queryKey, result);
  clearDraft();
}
