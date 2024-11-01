import { createContext } from 'react';
import { ReactNode } from 'react';
import { RefObject, useContext } from 'react';

export type NavigationContext = {
  navOpen: boolean;
  handleOnClick: () => void;
  navigation: RefObject<HTMLElement | null> | null;
};

type NavigationProviderProps = {
  children: ReactNode;
} & NavigationContext;

const NavigationContext = createContext<NavigationContext | null>(null);

export default function NavigationProvider({
  children,
  navOpen,
  handleOnClick,
  navigation,
}: NavigationProviderProps) {
  return (
    <NavigationContext.Provider value={{ navOpen, handleOnClick, navigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const navigation = useContext(NavigationContext);
  if (navigation === null) {
    throw new Error('Trying to use Navigation Context outside of provider');
  }

  return navigation;
}
