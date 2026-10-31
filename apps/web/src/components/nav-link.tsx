'use client';

import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@movies/ui/components/sidebar';
import { Eye, Home, List, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
          className="h-11 rounded-lg px-4 text-base md:h-10 md:text-sm [&_svg]:size-5 md:[&_svg]:size-4.5"
          render={<Link href={href} onClick={() => setOpenMobile(false)} />}
        >
          <Icon className={isActive ? activeClass : undefined} aria-hidden="true" />
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
