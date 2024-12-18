'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Overlay from '@/components/Overlay';
import NavigationAside from '@/components/NavigationAside';
import SkipToElement from '@/components/SkipToElement';
import { useLockScroll } from '@/hooks/use-lock-scroll';
import NavigationProvider from '@/contexts/NavigationProvider';

type ClientLayoutProps = {
  children: ReactNode;
};

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
    <NavigationProvider
      navOpen={navOpen}
      handleOnClick={handleOnClick}
      navigation={navigation}
    >
      <div className="text-neutral-50 desktop:grid desktop:h-screen desktop:grid-cols-12">
        <SkipToElement
          className="absolute left-3 top-3 z-40"
          elementId="main-content"
        />

        <Overlay />

        <NavigationAside />

        <div className="container col-span-10 col-start-3 row-span-full mx-auto flex h-full max-w-screen-xl flex-col px-4 desktop:max-h-screen desktop:px-8">
          <div className="scrollbar-thin flex flex-1 flex-col pb-16 desktop:overflow-y-auto desktop:pr-2">
            <Header />

            <main id="main-content" className="max-w-screen-xl flex-1">
              {children}
            </main>

            <footer className="mt-auto pt-5">
              <p className="text-center text-xs text-zinc-400">
                This product uses the TMDb API but is not endorsed or certified
                by TMDb
              </p>
            </footer>
          </div>
        </div>
      </div>
    </NavigationProvider>
  );
}
