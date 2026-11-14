/** Private caches belong to a session identity; late saves cannot seed another account's cache. */
export function accountQueryKey(base: readonly unknown[], userId: string | null) {
  return ['account', userId, ...base] as const;
}

/** Preserve pagination placeholders only while the same account owns the observer. */
export function accountPlaceholderData<T>(
  previous: T | undefined,
  previousQuery: { queryKey: readonly unknown[] } | undefined,
  accountId: string | null,
): T | undefined {
  if (!accountId || previousQuery?.queryKey[1] !== accountId) {
    return undefined;
  }
  return previous;
}
