import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { getSession } from '@/lib/auth-server';
import { createLoginUrl } from '@/lib/utils';
import { LogIn } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { NavUser } from './nav-user';

export async function UserFooter() {
  const session = await getSession();
  const headersList = await headers();
  const pathname =
    headersList.get('x-invoke-path') || headersList.get('x-pathname') || '/';
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

function UserFooterGhost() {
  return <div className="h-12 animate-pulse rounded-md bg-gray-200/10" />;
}

UserFooter.Ghost = UserFooterGhost;
