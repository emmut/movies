'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Overlay from '@/components/overlay';
import NavigationAside from '@/components/navigation-aside';
import SkipToElement from '@/components/skip-to-element';
import { useLockScroll } from '@/hooks/use-lock-scroll';
import NavigationProvider from '@/providers/navigation';
import { Footer } from './footer';

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
  const scrollContainer = useRef<HTMLDivElement>(null);

  return (
    <NavigationProvider
      navOpen={navOpen}
      handleOnClick={handleOnClick}
      navigation={navigation}
      scrollContainer={scrollContainer}
    >
      <div className="desktop:grid desktop:h-screen desktop:grid-cols-12 text-neutral-50">
        <SkipToElement
          className="absolute top-3 left-3 z-40"
          elementId="main-content"
        />

        <Overlay />

        <NavigationAside />

        <div className="desktop:max-h-screen desktop:px-8 col-span-10 col-start-3 row-span-full container mx-auto flex h-full max-w-(--breakpoint-xl) flex-col px-4">
          <div
            className="scrollbar-thin desktop:overflow-y-auto desktop:pr-2 flex flex-1 flex-col pb-16"
            ref={scrollContainer}
          >
            <Header />

            <main id="main-content" className="max-w-(--breakpoint-xl) flex-1">
              {children}
            </main>

            <Footer />
          </div>
        </div>
      </div>
    </NavigationProvider>
  );
}
