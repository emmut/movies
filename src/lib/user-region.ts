import 'server-only';
import { DEFAULT_REGION } from './regions';
import { getUserRegion } from './user-actions';

/**
 * Retrieves the user's region, returning the default region if retrieval fails.
 */
export async function getUserRegionWithFallback() {
  try {
    return await getUserRegion();
  } catch (error) {
    console.warn('Could not get user region, using fallback:', DEFAULT_REGION, error);
    return DEFAULT_REGION;
  }
}
