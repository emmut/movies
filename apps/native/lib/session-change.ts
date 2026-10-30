export type SessionChange = 'none' | 'account-changed' | 'signed-out';

/**
 * Classifies a settled session against the previous settled one. The first
 * settled session (`previous` undefined) is the baseline, not a change.
 */
export function classifySessionChange(
  previous: string | null | undefined,
  current: string | null,
): SessionChange {
  if (previous === undefined || previous === current) {
    return 'none';
  }
  if (current === null) {
    return 'signed-out';
  }
  return 'account-changed';
}
