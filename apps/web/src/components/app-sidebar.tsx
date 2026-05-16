
import { Home, Sparkles } from 'lucide-react';
import Link from '@tanstack/react-router';
import { usePathname } from '@tanstack/react-router';
import type * as React from 'react';

import Brand from '@movies/ui/components/brand';
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
  useSidebar,
} from '@movies/ui/components/sidebar';
import { cn } from '@movies/ui/lib/utils';

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

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  userNav?: React.ReactNode;
  userFooter?: React.ReactNode;
};

export function AppSidebar({ userNav, userFooter, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Brand />
      </SidebarHeader>
      <SidebarContent className="p-1">
        <SidebarMenu>
          <SidebarGroupContent className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  isActive={pathname === href}
                  render={<Link href={href} onClick={() => setOpenMobile(false)} />}
                >
                  <Icon className={cn('h-4 w-4', pathname === href && 'fill-current')} />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {userNav}
          </SidebarGroupContent>
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>{userFooter}</SidebarFooter>
    </Sidebar>
  );
}
