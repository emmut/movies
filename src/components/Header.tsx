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
    <header className="">
      <div className="mb-4 flex w-full items-baseline justify-between desktop:mb-0">
        <Link href="/">
          <Brand className="desktop:hidden" />
        </Link>
        <button
          className="text-neutral relative z-20 grid h-8 w-8 place-items-center desktop:hidden"
          onClick={handleOnClick}
        >
          {navOpen ? (
            <UnionIcon className="w-6" />
          ) : (
            <MenuIcon className="w-7" />
          )}
        </button>
      </div>
      <SearchBar />
    </header>
  );
}
