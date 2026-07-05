import { getSession } from '@/lib/auth-server';

import { NavLink } from './nav-link';
import { Skeleton } from './ui/skeleton';
import { SidebarMenuItem } from './ui/sidebar';

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
      <NavGhostItem />
      <NavGhostItem />
    </>
  );
}

function NavGhostItem() {
  return (
    <SidebarMenuItem>
      <div className="flex w-full items-center gap-2 rounded-md p-2">
        <Skeleton className="h-4 w-4 shrink-0" />
        <Skeleton className="h-4 flex-1" />
      </div>
    </SidebarMenuItem>
  );
}

UserNav.Ghost = UserNavGhost;
