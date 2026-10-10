import { usePathname, useRouter } from 'expo-router';
import { Alert, Linking } from 'react-native';

import { webUrl } from './connections';
import { getMenuDestination } from './navigation-menu';

export function useNavigationMenu() {
  const router = useRouter();
  const pathname = usePathname();
  function select(id: string) {
    const destination = getMenuDestination(id, webUrl);
    if (!destination) return;
    if (destination.kind === 'native') {
      if (pathname !== destination.path) router.dismissTo(destination.path);
      return;
    }
    void Linking.openURL(destination.url).catch(() => {
      Alert.alert('Couldn’t open screen', 'Check the web app address and try again.');
    });
  }
  return select;
}
