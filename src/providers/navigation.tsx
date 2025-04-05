import { createContext, ReactNode, RefObject, useContext } from 'react';

export type NavigationContext = {
  navOpen: boolean;
  handleOnClick: () => void;
  navigation: RefObject<HTMLElement | null> | null;
  scrollContainer: RefObject<HTMLElement | null> | null;
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
  scrollContainer,
}: NavigationProviderProps) {
  return (
    <NavigationContext.Provider
      value={{ navOpen, handleOnClick, navigation, scrollContainer }}
    >
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
