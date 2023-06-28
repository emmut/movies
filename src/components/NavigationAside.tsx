import Link from 'next/link';
import cn from 'classnames';
import Brand from '@/components/Brand';
import NavigationLink from '@/components/NavigationLink';
import CompassIcon from '@/icons/CompassIcon';
import HouseIcon from '@/icons/HouseIcon';
import { NavLink } from '@/types/NavLink';
import { useContext } from 'react';
import { NavigationContext } from './LayoutClient';

export default function NavigationAside() {
  const links: NavLink[] = [
    {
      href: '/',
      label: 'Home',
      icon: <HouseIcon className="-mt-0.5" />,
    },
    {
      href: '/discover',
      label: 'Discover',
      icon: <CompassIcon />,
    },
  ];

  const { navOpen } = useContext(NavigationContext) as NavigationContext;

  return (
    <aside
      className={cn([
        'max-w-screen-xs fixed top-0 z-30 col-span-2 row-span-full flex h-full w-full flex-col',
        'items-center border-r border-zinc-600 bg-neutral-900 p-3 shadow-2xl transition-all duration-200',
        'w-[calc(100vw-4rem)] min-[320px]:w-[calc(100vw-7rem)] desktop:static desktop:left-auto desktop:w-auto',
        { 'translate-x-[-100vw] desktop:translate-x-0': !navOpen },
        { 'translate-x-0': navOpen },
      ])}
    >
      <Link href="/" title="Go to home">
        <Brand className="hidden desktop:block" />
      </Link>

      <nav className="grid h-full flex-1 place-items-center bg-neutral-900">
        <ul className="grid grid-cols-1 gap-8">
          {links.map((link, i) => {
            return <NavigationLink key={link.href} link={link} index={i} />;
          })}
        </ul>
      </nav>
    </aside>
  );
}
