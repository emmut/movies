import type * as React from 'react';
import { Home, Sparkles } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarMenu>
          <SidebarGroupContent>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/discover">
                  <Sparkles className="h-4 w-4" />
                  <span>Discover</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
