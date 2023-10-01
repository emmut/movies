import Link from 'next/link';
import clsx from 'clsx';
import Brand from '@/components/Brand';
import NavigationLink from '@/components/nav/NavigationLink';
import CompassIcon from '@/icons/CompassIcon';
import HouseIcon from '@/icons/HouseIcon';
import type { NavLink } from '@/types/NavLink';
import { useNavigationContext } from '@/providers/NavigationProvider';
import { signIn, useSession } from 'next-auth/react';
import Auth from '../auth/Auth';
import UserDetails from '../UserDetails';
import Guest from '../auth/Guest';

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

  const { navOpen, navigation } = useNavigationContext();

  const { data: session, status } = useSession();

  return (
    <aside
      className={clsx([
        'max-w-screen-xs fixed top-0 z-30 col-span-2 row-span-full flex h-full w-full flex-col',
        'items-center border-r border-zinc-600 bg-neutral-900 p-3 shadow-2xl transition-all duration-200',
        'w-[calc(100vw-4rem)] max-w-screen-sm min-[320px]:w-[calc(100vw-8rem)] desktop:static desktop:left-auto desktop:w-auto',
        { 'translate-x-[-100vw] desktop:translate-x-0': !navOpen },
        { 'translate-x-0': navOpen },
      ])}
      tabIndex={0}
      ref={navigation}
    >
      <Link className="hidden desktop:block" href="/" title="Go to home">
        <Brand />
      </Link>

      <nav className="grid h-full flex-1 place-items-center bg-neutral-900">
        <ul className="grid grid-cols-1 gap-8">
          {links.map((link) => (
            <NavigationLink key={link.href} link={link} />
          ))}
        </ul>
      </nav>

      <div className="">
        <Auth>
          <UserDetails />
        </Auth>
        <Guest>
          <button
            className="rounded-md border border-neutral-50 px-4 py-1.5 text-sm"
            onClick={() => signIn()}
          >
            Sign in
          </button>
        </Guest>
      </div>
    </aside>
  );
}
