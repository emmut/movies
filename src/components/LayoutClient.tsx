'use client';

import { ReactNode, useState } from 'react';
import cn from 'classnames';
import Brand from '@/components/Brand';
import NavigationLink from '@/components/NavigationLink';
import CompassIcon from '@/icons/CompassIcon';
import HouseIcon from '@/icons/HouseIcon';

import { NavLink } from '@/types/NavLink';
import SearchBar from './SearchBar';
import UnionIcon from '@/icons/UnionIcon';
import MenuIcon from '@/icons/MenuIcon';
import Link from 'next/link';

type ClientLayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: ClientLayoutProps) {
  const [navOpen, setNavOpen] = useState(false);

  const links: NavLink[] = [
    {
      href: '/',
      label: 'Home',
      icon: <HouseIcon />,
    },
    {
      href: '/discover',
      label: 'Discover',
      icon: <CompassIcon />,
    },
  ];

  function handleOnClick() {
    setNavOpen((prevNavOpen) => !prevNavOpen);
  }

  return (
    <div className="grid-cols-1 text-neutral-50 desktop:grid desktop:h-screen desktop:grid-cols-12 desktop:grid-rows-[repeat(12,minmax(0,1fr))]">
      <aside
        className={cn([
          'absolute z-20 col-span-2 row-span-full flex h-full w-full max-w-screen-xs flex-col items-center border-r border-zinc-600 bg-neutral-900 p-3 shadow-2xl transition-all duration-200 xs:w-[calc(100vw-7rem)] desktop:static desktop:left-auto desktop:w-auto',
          { 'translate-x-[-100vw] desktop:translate-x-0': !navOpen },
          { 'translate-x-0': navOpen },
        ])}
      >
        <Link href="/">
          <Brand className="hidden desktop:block" />
        </Link>
        <nav className="grid h-full flex-1 place-items-center bg-neutral-900">
          <ul className="grid grid-cols-1 gap-4">
            {links.map((link) => {
              return <NavigationLink key={link.href} link={link} />;
            })}
          </ul>
        </nav>
      </aside>

      <div className="container col-span-10 col-start-3 mx-auto px-4 py-6">
        <div className="mb-4 flex w-full items-baseline justify-between desktop:mb-0">
          <Link href="/">
            <Brand className="desktop:hidden" />
          </Link>
          <button
            className="text-neutral relative z-20 grid h-8 w-8 place-items-center desktop:hidden"
            onClick={handleOnClick}
          >
            {navOpen ? (
              <UnionIcon className="w-6" />
            ) : (
              <MenuIcon className="w-7" />
            )}
          </button>
        </div>

        <SearchBar />
      </div>

      {navOpen && (
        <div
          className="absolute inset-0 z-10 cursor-pointer bg-neutral-900/40"
          onClick={handleOnClick}
        />
      )}

      <div className="container col-span-10 col-start-3 row-start-2 row-end-[13] mx-auto px-4 pb-16 pt-4 desktop:max-h-screen desktop:overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
