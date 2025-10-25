'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from './ui/sidebar';

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function NavLink({ href, label, icon: Icon }: NavLinkProps) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === href}>
          <Link href={href} onClick={() => setOpenMobile(false)}>
            <Icon
              className={cn('h-4 w-4', pathname === href && 'fill-current')}
            />
            <span>{label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

NavLink.displayName = 'NavLink';
export { NavLink };
