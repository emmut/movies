'use client';

import { List, Star } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useLocation } from '@tanstack/react-router';

import { cn } from '@/lib/utils';

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
  const { pathname } = useLocation();
  const Icon = iconMap[icon];

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={pathname === href}
          render={<Link to={href} onClick={() => setOpenMobile(false)} />}
        >
          <Icon className={cn('h-4 w-4', pathname === href && 'fill-current')} />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

NavLink.displayName = 'NavLink';
export { NavLink };
