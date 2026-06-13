'use client';

import type * as React from 'react';

import Brand from '@/components/brand';
import { NavLink } from '@/components/nav-link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from '@/components/ui/sidebar';

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: 'home',
  },
  {
    href: '/discover',
    label: 'Discover',
    icon: 'sparkles',
  },
] as const;

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  userNav?: React.ReactNode;
  userFooter?: React.ReactNode;
};

export function AppSidebar({ userNav, userFooter, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Brand />
      </SidebarHeader>
      <SidebarContent className="p-1">
        <nav aria-label="Main">
          <SidebarMenu>
            <SidebarGroupContent className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
              {userNav}
            </SidebarGroupContent>
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>{userFooter}</SidebarFooter>
    </Sidebar>
  );
}
