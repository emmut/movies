import Link from 'next/link';
import MenuIcon from '@/icons/MenuIcon';
import UnionIcon from '@/icons/UnionIcon';
import SearchBar from '@/components/SearchBar';
import Brand from '@/components/Brand';
import { useNavigationContext } from '@/contexts/NavigationProvider';

export default function Header() {
  const { navOpen, handleOnClick } = useNavigationContext();

  return (
    <header className="sticky top-0 z-20 bg-neutral-800 py-4">
      <div className="mb-4 flex w-full items-baseline justify-between desktop:mb-0">
        <Link className="desktop:hidden" href="/" title="Go to home">
          <Brand />
        </Link>

        <button
          className="text-neutral relative grid h-8 w-8 place-items-center desktop:hidden"
          onClick={handleOnClick}
          aria-label="Open menu"
        >
          {navOpen ? (
            <UnionIcon className="w-6" />
          ) : (
            <MenuIcon className="h-[15px] w-[28px]" />
          )}
        </button>
      </div>
      <SearchBar />
    </header>
  );
}
