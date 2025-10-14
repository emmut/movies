'use client';

import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { createLoginUrl } from '@/lib/utils';

export function UserLogin() {
  const pathname = usePathname();
  const loginUrl = createLoginUrl(pathname);

  if (pathname === '/login') {
    return null;
  }

  return (
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
  );
}
