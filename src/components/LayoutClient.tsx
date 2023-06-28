'use client';

import { ReactNode, createContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Overlay from './Overlay';
import NavigationAside from './NavigationAside';
import { useLockScroll } from '@/hooks/use-lock-scroll';

type ClientLayoutProps = {
  children: ReactNode;
};

export type NavigationContext = {
  navOpen: boolean;
  handleOnClick: () => void;
};

export const NavigationContext = createContext<NavigationContext | null>(null);

export default function Layout({ children }: ClientLayoutProps) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  function handleOnClick() {
    setNavOpen((prevNavOpen) => !prevNavOpen);
  }

  useLockScroll({ locked: navOpen });

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <NavigationContext.Provider value={{ navOpen, handleOnClick }}>
      <div className="h-full grid-cols-1 text-neutral-50 desktop:grid desktop:h-screen desktop:grid-cols-12">
        <Overlay />

        <NavigationAside />

        <div className="container col-span-10 col-start-3 row-span-full mx-auto flex h-full max-h-screen flex-col px-4 desktop:px-8">
          <Header />

          <div className="flex flex-1 flex-col pb-16 desktop:overflow-y-auto">
            <div className="flex-1">{children}</div>

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
