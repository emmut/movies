import { getSession } from '@/lib/auth-server';

import { NavLink } from './nav-link';
import { SidebarMenuSkeleton } from './ui/sidebar';

const userNavItems = [
  {
    href: '/watchlist',
    label: 'Watchlist',
    icon: 'star' as const,
  },
  {
    href: '/lists',
    label: 'Lists',
    icon: 'list' as const,
  },
];

export async function UserNav() {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  return (
    <>
      {userNavItems.map(({ href, label, icon }) => (
        <NavLink key={href} href={href} label={label} icon={icon} />
      ))}
    </>
  );
}

function UserNavGhost() {
  return (
    <>
      <SidebarMenuSkeleton />
      <SidebarMenuSkeleton />
    </>
  );
}

UserNav.Ghost = UserNavGhost;
