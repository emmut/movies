'use client';

import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { createLoginUrl } from '@/lib/utils';

export function UserLogin() {
  const pathname = usePathname();
  const loginUrl = createLoginUrl(pathname);
  const { setOpenMobile } = useSidebar();

  if (pathname === '/login') {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton render={<Link href={loginUrl} onClick={() => setOpenMobile(false)} />}>
          <LogIn className="h-4 w-4" />
          <span>Login</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
