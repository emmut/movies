'use client';

import { Home, List, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

import { SidebarMenuButton, SidebarMenuItem, useSidebar } from './ui/sidebar';

const iconMap = {
  star: Star,
  list: List,
  home: Home,
  sparkles: Sparkles,
};

type NavLinkProps = {
  href: string;
  label: string;
  icon: keyof typeof iconMap;
};

function NavLink({ href, label, icon }: NavLinkProps) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const Icon = iconMap[icon];

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={pathname === href}
          render={<Link href={href} onClick={() => setOpenMobile(false)} />}
        >
          <Icon className={cn('h-4 w-4', pathname === href && 'fill-current')} />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

NavLink.displayName = 'NavLink';
export { NavLink };
