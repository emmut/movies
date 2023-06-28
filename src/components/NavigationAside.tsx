import Link from 'next/link';
import cn from 'classnames';
import Brand from '@/components/Brand';
import NavigationLink from '@/components/NavigationLink';
import CompassIcon from '@/icons/CompassIcon';
import HouseIcon from '@/icons/HouseIcon';
import { NavLink } from '@/types/NavLink';

type NavigationAsideProps = {
  navOpen: boolean;
};

export default function NavigationAside({ navOpen }: NavigationAsideProps) {
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

  return (
    <aside
      className={cn([
        'max-w-screen-xs absolute z-20 col-span-2 row-span-full flex h-full w-full flex-col ',
        'items-center border-r border-zinc-600 bg-neutral-900 p-3 shadow-2xl transition-all duration-200',
        'min-[320px]:w-[calc(100vw-7rem)] desktop:static desktop:left-auto desktop:w-auto',
        { 'translate-x-[-100vw] desktop:translate-x-0': !navOpen },
        { 'translate-x-0': navOpen },
      ])}
    >
      <Link href="/" title="Go to home">
        <Brand className="hidden desktop:block" />
      </Link>

      <nav className="grid h-full flex-1 place-items-center bg-neutral-900">
        <ul className="grid grid-cols-1 gap-8">
          {links.map((link) => {
            return <NavigationLink key={link.href} link={link} />;
          })}
        </ul>
      </nav>
    </aside>
  );
}
