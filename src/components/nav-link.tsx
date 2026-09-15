'use client';

import { cn } from 'cn';
import { Eye, Home, List, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SidebarMenuButton, SidebarMenuItem, useSidebar } from './ui/sidebar';

// activeClass: how the icon marks the active route. Solid shapes take
// `fill-current`; outline icons with inner detail (eye) go blobby when
// filled, so they get a heavier stroke instead.
const iconMap = {
  star: { Icon: Star, activeClass: 'fill-current' },
  list: { Icon: List, activeClass: 'fill-current' },
  home: { Icon: Home, activeClass: 'fill-current' },
  sparkles: { Icon: Sparkles, activeClass: 'fill-current' },
  eye: { Icon: Eye, activeClass: 'stroke-[2.5]' },
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
  const { Icon, activeClass } = iconMap[icon];

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          render={<Link href={href} onClick={() => setOpenMobile(false)} />}
        >
          <Icon className={cn('h-4 w-4', isActive && activeClass)} />
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
