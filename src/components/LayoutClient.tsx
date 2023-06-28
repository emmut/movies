'use client';

import {
  ReactNode,
  RefObject,
  createContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Overlay from './Overlay';
import NavigationAside from './NavigationAside';
import { useLockScroll } from '@/hooks/use-lock-scroll';
import SkipToElement from './SkipToElement';

type ClientLayoutProps = {
  children: ReactNode;
};

export type NavigationContext = {
  navOpen: boolean;
  handleOnClick: () => void;
  navigation: RefObject<HTMLElement> | null;
};

export const NavigationContext = createContext<NavigationContext | null>(null);

export default function Layout({ children }: ClientLayoutProps) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  function handleOnClick() {
    setNavOpen((prevNavOpen) => !prevNavOpen);

    if (navigation.current) {
      navigation.current.focus();
    }
  }

  useLockScroll({ locked: navOpen });

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  const navigation = useRef<HTMLElement>(null);

  return (
    <NavigationContext.Provider value={{ navOpen, handleOnClick, navigation }}>
      <div className="h-full grid-cols-1 text-neutral-50 desktop:grid desktop:h-screen desktop:grid-cols-12">
        <SkipToElement
          className="absolute left-3 top-3 z-40"
          elementId="main-content"
        />

        <Overlay />

        <NavigationAside />

        <div className="container col-span-10 col-start-3 row-span-full mx-auto flex h-full max-h-screen flex-col px-4 desktop:px-8">
          <Header />

          <div className="flex flex-1 flex-col pb-16 desktop:overflow-y-auto">
            <div id="main-content" className="flex-1">
              {children}
            </div>

            <footer className="mt-auto pt-5">
              <p className="text-center text-xs text-zinc-400">
                This product uses the TMDb API but is not endorsed or certified
                by TMDb
              </p>
            </footer>
          </div>
        </div>
      </div>
    </NavigationContext.Provider>
  );
}
