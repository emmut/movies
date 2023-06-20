import Brand from '@/components/Brand';
import SearchBar from '@/components/SearchBar';
import MenuIcon from '@/icons/MenuIcon';
import UnionIcon from '@/icons/UnionIcon';
import { Dispatch, SetStateAction } from 'react';

type HeaderProps = {
  navOpen: boolean;
  setNavOpen: Dispatch<SetStateAction<boolean>>;
};

export default function Header({ navOpen }: HeaderProps) {
  return (
    <div className="container col-span-10 col-start-3 mx-auto px-4 py-6">
      <div className="flex">
        <Brand />
        <button>{navOpen ? <MenuIcon /> : <UnionIcon />}</button>
      </div>
      <SearchBar />
    </div>
  );
}
