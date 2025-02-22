'use client';

import type * as React from 'react';
import { ComputerIcon, Home, MoonIcon, Sparkles, SunIcon } from 'lucide-react';

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
import Link from 'next/link';
import Brand from '@/components/brand';
import { usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Theme, useThemeStore } from '@/stores/theme';

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
  const { theme, setTheme } = useThemeStore();

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
      <SidebarFooter>
        <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
          <SelectTrigger className="mb-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">
              <SunIcon className="h-4 w-4" />
              Light
            </SelectItem>
            <SelectItem value="dark">
              <MoonIcon className="h-4 w-4" />
              Dark
            </SelectItem>
            <SelectItem value="system">
              <ComputerIcon className="h-4 w-4" />
              System
            </SelectItem>
          </SelectContent>
        </Select>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
