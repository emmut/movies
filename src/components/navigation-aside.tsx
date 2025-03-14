import Link from 'next/link';
import clsx from 'clsx';
import Brand from '@/components/brand';
import NavigationLink from '@/components/navigation-link';
import CompassIcon from '@/icons/CompassIcon';
import HouseIcon from '@/icons/HouseIcon';
import type { NavLink } from '@/types/NavLink';
import { useNavigationContext } from '@/providers/navigation';

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

  return (
    <aside
      className={clsx([
        'max-w-[theme(screens.xs)] fixed top-0 z-30 col-span-2 row-span-full flex h-full w-full flex-col',
        'items-center border-r border-zinc-600 bg-neutral-900 p-3 shadow-2xl transition-all duration-200',
        'desktop:static desktop:left-auto desktop:w-auto w-[calc(100vw-4rem)] max-w-(--breakpoint-sm) min-[320px]:w-[calc(100vw-8rem)]',
        { 'desktop:translate-x-0 translate-x-[-100vw]': !navOpen },
        { 'translate-x-0': navOpen },
      ])}
      tabIndex={0}
      ref={navigation}
    >
      <Link className="desktop:block hidden" href="/" title="Go to home">
        <Brand />
      </Link>

      <nav className="grid h-full flex-1 place-items-center bg-neutral-900">
        <ul className="grid grid-cols-1 gap-8">
          {links.map((link) => (
            <NavigationLink key={link.href} link={link} />
          ))}
        </ul>
      </nav>
    </aside>
  );
}
