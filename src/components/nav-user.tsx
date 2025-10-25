'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { signOut } from '@/lib/auth-client';
import { ChevronsUpDown, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserAvatar } from './user-avatar';
import { UserInfo } from './user-info';

/**
 * Renders a user navigation menu within a sidebar, providing access to user information and a logout option.
 *
 * Displays the user's avatar and details in a sidebar menu button that triggers a dropdown. The dropdown adapts its alignment based on device type and includes a logout action that signs the user out and refreshes the page upon success.
 *
 * @param user - The user object containing name, email, and avatar URL to display in the menu.
 */
export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  async function handleLogout() {
    try {
      const { error, data } = await signOut();

      if (error) {
        console.error('Logout failed:', error);
        toast.error('Logout failed', {
          description: 'Please try again later.',
        });
      } else if (data?.success) {
        toast.success('You have been logged out', {
          description: 'See you soon!',
        });
        router.refresh();
      } else {
        console.error('Unexpected logout response:', data);
        toast.error('An error occurred', {
          description: 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout', {
        description: 'Please try again later.',
      });
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar user={user} />
              <UserInfo user={user} />

              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar user={user} />
                <UserInfo user={user} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" onClick={() => setOpenMobile(false)}>
                <Settings />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
