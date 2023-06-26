'use client';

import Brand from '@/components/Brand';
import NavigationLink from '@/components/NavigationLink';
import CompassIcon from '@/icons/CompassIcon';
import HouseIcon from '@/icons/HouseIcon';

import { NavLink } from '@/types/NavLink';
import Link from 'next/link';

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
  return (
    <aside className="col-span-2 row-span-full flex flex-col items-center border-r border-zinc-600 bg-neutral-900 p-1 md:p-3">
      <Link href="/">
        <Brand />
      </Link>

      <nav className="grid flex-1 place-items-center">
        <ul className="grid grid-cols-1 gap-4">
          {links.map((link) => {
            return <NavigationLink key={link.href} link={link} />;
          })}
        </ul>
      </nav>
    </aside>
  );
}
