import { webUrl } from '@native/lib/connections';
import { getMenuDestination, type NativeMenuPath } from '@native/lib/navigation-menu';
import { captureActiveScroll } from '@native/lib/navigation-scroll';
import { usePathname, useRouter } from 'expo-router';
import { Alert, Linking } from 'react-native';

export function useNavigationMenu() {
  const router = useRouter();
  const pathname = usePathname();
  function navigateNative(path: NativeMenuPath) {
    captureActiveScroll();
    if (pathname === path) {
      return;
    }
    if (path.startsWith('/more/')) {
      router.push(path);
      return;
    }
    router.dismissTo(path);
  }
  function select(id: string) {
    const destination = getMenuDestination(id, webUrl);
    if (!destination) {
      return;
    }
    if (destination.kind === 'native') {
      navigateNative(destination.path);
      return;
    }
    void Linking.openURL(destination.url).catch(() => {
      Alert.alert('Couldn’t open screen', 'Check the web app address and try again.');
    });
  }
  return select;
}
