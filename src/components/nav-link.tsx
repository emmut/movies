'use client';

import { Eye, Home, List, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

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

function NavLink({ href, label, icon }: NavLinkProps) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const { Icon, activeClass } = iconMap[icon];

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={pathname === href}
          render={<Link href={href} onClick={() => setOpenMobile(false)} />}
        >
          <Icon className={cn('h-4 w-4', pathname === href && activeClass)} />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

NavLink.displayName = 'NavLink';
export { NavLink };
