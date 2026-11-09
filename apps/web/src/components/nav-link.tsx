'use client';

import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@movies/ui/components/sidebar';
import { Eye, Home, List, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const iconMap = {
  star: Star,
  list: List,
  home: Home,
  sparkles: Sparkles,
  eye: Eye,
};

type NavLinkProps = {
  href: string;
  label: string;
  icon: keyof typeof iconMap;
};

type NavLinkItemProps = NavLinkProps & {
  isActive: boolean;
};

function NavLinkItem({ href, label, icon, isActive }: NavLinkItemProps) {
  const { setOpenMobile } = useSidebar();
  const Icon = iconMap[icon];

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          aria-current={isActive ? 'page' : undefined}
          tooltip={label}
          className="h-11 md:h-8"
          render={<Link href={href} onClick={() => setOpenMobile(false)} />}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

function NavLink(props: NavLinkProps) {
  const pathname = usePathname();

  return <NavLinkItem {...props} isActive={pathname === props.href} />;
}

function NavLinkFallback(props: NavLinkProps) {
  return <NavLinkItem {...props} isActive={false} />;
}

NavLink.displayName = 'NavLink';
export { NavLink, NavLinkFallback };
