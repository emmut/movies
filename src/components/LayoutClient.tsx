'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import cn from 'classnames';
import Header from '@/components/Header';
import Overlay from './Overlay';
import NavigationAside from './NavigationAside';

type ClientLayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: ClientLayoutProps) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  function handleOnClick() {
    setNavOpen((prevNavOpen) => !prevNavOpen);
  }

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="grid-cols-1 text-neutral-50 desktop:grid desktop:h-screen desktop:grid-cols-12">
      <NavigationAside navOpen={navOpen} />

      <Overlay navOpen={navOpen} handleOnClick={handleOnClick} />

      <div className="container col-span-10 col-start-3 row-span-full mx-auto flex max-h-screen flex-col px-4 pt-6 desktop:px-8">
        <Header navOpen={navOpen} handleOnClick={handleOnClick} />

        <div
          className={cn([
            'flex flex-1 flex-col pb-8 pt-4',
            { 'overflow-y-auto': !navOpen },
            { 'overflow-y-hidden': navOpen },
          ])}
        >
          <div className="flex-1">{children}</div>
          <footer className="mt-auto pt-4">
            <p className="text-center text-xs text-zinc-500">
              This product uses the TMDb API but is not endorsed or certified by
              TMDb
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
