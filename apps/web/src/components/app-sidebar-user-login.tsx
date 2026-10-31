'use client';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@movies/ui/components/sidebar';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
        <SidebarMenuButton
          className="h-11 rounded-lg px-4 text-base md:h-10 md:text-sm [&_svg]:size-5 md:[&_svg]:size-4.5"
          render={<Link href={loginUrl} onClick={() => setOpenMobile(false)} />}
        >
          <LogIn aria-hidden="true" />
          <span>Login</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
