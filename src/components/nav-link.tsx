'use client';

import { cn } from '@/lib/utils';
import { List, Star } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from './ui/sidebar';

type NavLinkProps = {
  href: string;
  label: string;
  icon: 'star' | 'list';
};

const iconMap = {
  star: Star,
  list: List,
};

function NavLink({ href, label, icon }: NavLinkProps) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const Icon = iconMap[icon];

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === href}>
          <Link href={href} onClick={() => setOpenMobile(false)}>
            <Icon
              className={cn('h-4 w-4', pathname === href && 'fill-current')}
            />
            <span>{label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

NavLink.displayName = 'NavLink';
export { NavLink };
