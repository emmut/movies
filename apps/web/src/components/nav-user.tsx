import { ChevronsUpDown, LogOut, Settings } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@movies/ui/components/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@movies/ui/components/sidebar';
import { signOut } from '@/lib/auth-client';

import { UserAvatar } from './user-avatar';
import { UserInfo } from './user-info';

/**
 * Renders a user navigation menu within a sidebar, providing access to user information and a logout option.
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
        await queryClient.invalidateQueries();
        navigate({ to: '/' });
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
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <UserAvatar user={user} />
            <UserInfo user={user} />
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <UserAvatar user={user} />
                  <UserInfo user={user} />
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link to="/settings" onClick={() => setOpenMobile(false)} />}
            >
              <Settings />
              Settings
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
