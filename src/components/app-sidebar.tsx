'use client';

import { Home, LogIn, Sparkles, Star } from 'lucide-react';
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
import { Session } from '@/lib/auth-client';
import { cn, createLoginUrl } from '@/lib/utils';
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

const userNavItems = [
  {
    href: '/watchlist',
    label: 'Watchlist',
    icon: Star,
  },
];

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  initialSession: Session | null;
};

/**
 * Displays a sidebar navigation UI with menu items and footer content that adapt to the user's authentication status.
 *
 * Shows main navigation links for all users, adds user-specific links when a session is present, and renders either user info or a login prompt in the footer based on authentication state.
 *
 * @param initialSession - The current user session, or null if no user is authenticated. Controls which navigation and footer elements are displayed.
 */
export function AppSidebar({ initialSession, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const loginUrl = createLoginUrl(pathname);

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
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        pathname === href && 'fill-current'
                      )}
                    />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {initialSession?.user &&
              userNavItems.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={pathname === href}>
                    <Link href={href}>
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          pathname === href && 'fill-current'
                        )}
                      />
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
        {initialSession?.user && (
          <NavUser
            user={{
              name: initialSession.user.name,
              email: initialSession.user.email,
              avatar: initialSession.user.image ?? '',
            }}
          />
        )}

        {!initialSession?.user && pathname !== '/login' && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={loginUrl}>
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
