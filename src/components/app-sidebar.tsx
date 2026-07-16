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
import { Skeleton } from '@/components/ui/skeleton';

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

// Named export rather than an `AppSidebar.Ghost` static: this is a 'use client'
// module, and runtime property assignments don't survive the client-reference
// proxy that server components (AppSidebarWrapper) import through.
export function AppSidebarGhost() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Skeleton className="h-8 w-32" />
      </SidebarHeader>
      <SidebarContent className="p-1">
        <nav aria-label="Main">
          <SidebarMenu>
            <SidebarGroupContent className="flex flex-col gap-1">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </SidebarGroupContent>
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <Skeleton className="h-12 w-full" />
      </SidebarFooter>
    </Sidebar>
  );
}

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
