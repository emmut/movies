'use client';

import * as React from 'react';

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

function MainNavGhost() {
  return (
    <>
      {navItems.map((item) => (
        <Skeleton key={item.href} className="h-10 w-full" />
      ))}
    </>
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
              <React.Suspense fallback={<MainNavGhost />}>
                {navItems.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </React.Suspense>
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
