import { List, Star } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getSession } from '@/lib/auth-server';

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

export async function UserNav({ pathname }: { pathname: string }) {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

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
