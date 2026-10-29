import { getMenuDestination, type NativeMenuPath } from '@native/lib/navigation-menu';
import { captureActiveScroll } from '@native/lib/navigation-scroll';
import { usePathname, useRouter } from 'expo-router';

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
    const destination = getMenuDestination(id);
    if (!destination) {
      return;
    }
    navigateNative(destination.path);
  }
  return select;
}
