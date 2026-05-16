
import { LogIn } from 'lucide-react';
import { Link, useLocation } from '@tanstack/react-router';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@movies/ui/components/sidebar';
import { createLoginUrl } from '@movies/ui/lib/utils';

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
