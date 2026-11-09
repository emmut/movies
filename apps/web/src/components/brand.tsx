import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@movies/ui/components/sidebar';
import { cn } from 'cn';
import { Popcorn } from 'lucide-react';
import Link from 'next/link';
type BrandProps = {
  className?: string;
};
export default function Brand({ className }: BrandProps) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className={cn('gap-2', className)}
          render={<Link href="/" aria-label="Movies home" onClick={() => setOpenMobile(false)} />}
        >
          <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Popcorn className="size-4" aria-hidden="true" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">Movies</span>
            <span className="truncate text-xs text-muted-foreground">Your movie library</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
