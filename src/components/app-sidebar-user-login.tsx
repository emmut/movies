'use client';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { createLoginUrl } from '@/lib/utils';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
        <SidebarMenuButton asChild>
          <Link href={loginUrl} onClick={() => setOpenMobile(false)}>
            <LogIn className="h-4 w-4" />
            <span>Login</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
