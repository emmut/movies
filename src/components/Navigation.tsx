import CompassIcon from '@/icons/CompassIcon';
import HouseIcon from '@/icons/HouseIcon';
import { NavLink } from '@/types/NavLink';
import NavigationLink from './NavigationLink';

export default function Navigation() {
  const links: NavLink[] = [
    {
      href: '/',
      label: 'Home',
      icon: <HouseIcon />,
    },
    {
      href: '/discover',
      label: 'Discover',
      icon: <CompassIcon />,
    },
  ];

  return (
    <nav className="grid flex-1 place-items-center">
      <ul className="grid grid-cols-1 gap-4">
        {links.map((link) => {
          return <NavigationLink key={link.href} link={link} />;
        })}
      </ul>
    </nav>
  );
}
