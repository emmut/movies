import { shouldRememberNavigation, type NavigationPress } from '@native/lib/navigation-press';
import { createContext, useContext, type ReactNode } from 'react';

function noScrollToRemember() {}
const ScrollNavigation = createContext({ capture: noScrollToRemember, cancel: noScrollToRemember });

export function ScrollNavigationProvider({
  capture,
  cancel,
  children,
}: {
  capture: () => void;
  cancel: () => void;
  children: ReactNode;
}) {
  return <ScrollNavigation value={{ capture, cancel }}>{children}</ScrollNavigation>;
}
export function useScrollNavigation() {
  const { capture, cancel } = useContext(ScrollNavigation);
  function remember(event?: NavigationPress) {
    if (shouldRememberNavigation(event)) {
      capture();
    }
  }
  return {
    onPointerDown: remember,
    onPointerUp: remember,
    onPressIn: remember,
    onPointerMove: cancel,
    onPointerCancel: cancel,
    onTouchMove: cancel,
  };
}
