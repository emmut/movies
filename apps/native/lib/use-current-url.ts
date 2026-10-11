import { routeUrl } from '@native/lib/route-url';
import { useLocalSearchParams, usePathname, useSegments } from 'expo-router';

export function useCurrentUrl() {
  return routeUrl(usePathname(), useLocalSearchParams(), useSegments());
}
