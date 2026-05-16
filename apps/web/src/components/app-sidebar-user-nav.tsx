import { Skeleton } from '@movies/ui/components/skeleton';
import { NavLink } from '@movies/ui/components/nav-link';
import { authClient } from '@/lib/auth-client';

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

export function UserNav() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <>
        <Skeleton className="mb-2 h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </>
    );
  }

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
      <Skeleton className="mb-2 h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </>
  );
}

UserNav.Ghost = UserNavGhost;
