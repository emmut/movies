'use client';

import { Home, LogIn, Sparkles } from 'lucide-react';
import type * as React from 'react';

import Brand from '@/components/brand';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavUser } from './nav-user';

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/discover',
    label: 'Discover',
    icon: Sparkles,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Brand />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarGroupContent>
            {navItems.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={pathname === href}>
                  <Link href={href}>
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroupContent>
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        {session?.user && (
          <NavUser
            user={{
              name: session.user.name,
              email: session.user.email,
              avatar: session.user.image || '',
            }}
          />
        )}

        {!session?.user && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/login'}>
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
