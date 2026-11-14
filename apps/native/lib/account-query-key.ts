/** Private caches belong to a session identity; late saves cannot seed another account's cache. */
export function accountQueryKey(base: readonly unknown[], userId: string | null) {
  return ['account', userId, ...base] as const;
}
