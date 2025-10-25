import { getSession } from '@/lib/auth-server';
import { List, Star } from 'lucide-react';
import { NavLink } from './nav-link';
import { Skeleton } from './ui/skeleton';

const userNavItems = [
  {
    href: '/watchlist',
    label: 'Watchlist',
    icon: Star,
  },
  {
    href: '/lists',
    label: 'Lists',
    icon: List,
  },
];

export async function UserNav() {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  return (
    <>
      {userNavItems.map(({ href, label, icon: Icon }) => (
        <NavLink key={href} href={href} label={label} icon={Icon} />
      ))}
    </>
  );
}

function UserNavGhost() {
  return (
    <>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </>
  );
}

UserNav.Ghost = UserNavGhost;
