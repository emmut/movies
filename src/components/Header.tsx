import MenuIcon from '@/icons/MenuIcon';
import UnionIcon from '@/icons/UnionIcon';
import Link from 'next/link';
import SearchBar from './SearchBar';
import Brand from './Brand';

type HeaderProps = {
  navOpen: boolean;
  handleOnClick: () => void;
};

export default function Header({ navOpen, handleOnClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-neutral-800 py-4">
      <div className="mb-4 flex w-full items-baseline justify-between desktop:mb-0">
        <Link href="/" title="Go to home">
          <Brand className="desktop:hidden" />
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
