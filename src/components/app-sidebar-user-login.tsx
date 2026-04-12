'use client';

import { LogIn } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useLocation } from '@tanstack/react-router';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { createLoginUrl } from '@/lib/utils';

export function UserLogin() {
  const { pathname } = useLocation();
  const loginUrl = createLoginUrl(pathname);
  const { setOpenMobile } = useSidebar();

  if (pathname === '/login') {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton render={<Link to={loginUrl} onClick={() => setOpenMobile(false)} />}>
          <LogIn className="h-4 w-4" />
          <span>Login</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
