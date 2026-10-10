import { shouldRememberNavigation, type NavigationPress } from '@native/lib/navigation-press';
import { createContext, useContext, type ReactNode } from 'react';

function noScrollToRemember() {}
const ScrollNavigation = createContext<() => void>(noScrollToRemember);

export function ScrollNavigationProvider({
  capture,
  children,
}: {
  capture: () => void;
  children: ReactNode;
}) {
  return <ScrollNavigation value={capture}>{children}</ScrollNavigation>;
}
export function useScrollNavigation() {
  const capture = useContext(ScrollNavigation);
  function remember(event?: NavigationPress) {
    if (shouldRememberNavigation(event)) {
      capture();
    }
  }
  return remember;
}
