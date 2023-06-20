'use client';
import { useState } from 'react';

import Header from '@/components/Header';
import Brand from '@/components/Brand';
import NavigationLink from '@/components/NavigationLink';
import CompassIcon from '@/icons/CompassIcon';
import HouseIcon from '@/icons/HouseIcon';

import { NavLink } from '@/types/NavLink';

export default function Navigation() {
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

  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <aside className="col-span-2 row-span-full flex flex-col items-center border-r border-zinc-600 bg-neutral-900 p-1 md:p-3">
        <Brand />
        <nav className="grid flex-1 place-items-center">
          <ul className="grid grid-cols-1 gap-4">
            {links.map((link) => {
              return <NavigationLink key={link.href} link={link} />;
            })}
          </ul>
        </nav>
      </aside>

      <Header navOpen={navOpen} setNavOpen={setNavOpen} />
    </>
  );
}
