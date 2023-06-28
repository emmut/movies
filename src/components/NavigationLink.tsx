'use client';
import Link from 'next/link';
import cn from 'classnames';
import { usePathname } from 'next/navigation';
import type { NavLink } from '@/types/NavLink';

type LinkProps = {
  link: NavLink;
};

export default function NavigationLink({ link }: LinkProps) {
  const pathname = usePathname();
  const isActive = pathname === link.href;

  return (
    <li key={link.href}>
      <Link
        href={link.href}
        className={cn([
          'flex h-6 min-w-[7rem] items-center gap-2',
          { 'font-bold': isActive, 'text-zinc-400': !isActive },
        ])}
      >
        <div className="w-6">{link.icon}</div>
        <div>{link.label}</div>
      </Link>
    </li>
  );
}
