import { isAuthNotConfigured } from '@movies/api/session';

/** Cached account identity must not be hidden by a public-only fallback. */
export function hasDiscoverySessionError(session: { error: unknown; data: unknown }) {
  if (!session.error) {
    return false;
  }
  if (session.data) {
    return true;
  }
  return !isAuthNotConfigured(session.error);
}
