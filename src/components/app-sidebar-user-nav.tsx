import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { getSession } from '@/lib/auth-server';
import { cn } from '@/lib/utils';
import { List, Star } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
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

  const headersList = await headers();
  const pathname =
    headersList.get('x-invoke-path') || headersList.get('x-pathname') || '/';

  return (
    <>
      {userNavItems.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton asChild isActive={pathname === href}>
            <Link href={href}>
              <Icon
                className={cn('h-4 w-4', pathname === href && 'fill-current')}
              />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
}

function UserNavGhost() {
  return (
    <SidebarMenuItem>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </SidebarMenuItem>
  );
}

UserNav.Ghost = UserNavGhost;
