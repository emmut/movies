import { LogIn } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { createLoginUrl } from '@/lib/utils';
import Link from 'next/link';
import { NavUser } from './nav-user';
import { getSession } from '@/lib/auth-server';

export async function UserFooter({ pathname }: { pathname: string }) {
  const session = await getSession();
  const loginUrl = createLoginUrl(pathname);

  if (session?.user) {
    return (
      <NavUser
        user={{
          name: session.user.name ?? '',
          email: session.user.email ?? '',
          avatar: session.user.image ?? '',
        }}
      />
    );
  }

  if (pathname !== '/login') {
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

  return null;
}
