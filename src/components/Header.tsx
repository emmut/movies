'use client';

import Brand from '@/components/Brand';
import SearchBar from '@/components/SearchBar';
import MenuIcon from '@/icons/MenuIcon';
import UnionIcon from '@/icons/UnionIcon';
import Link from 'next/link';
import { Dispatch, SetStateAction } from 'react';

type HeaderProps = {
  navOpen: boolean;
  setNavOpen: Dispatch<SetStateAction<boolean>>;
};

export default function Header({ navOpen, setNavOpen }: HeaderProps) {
  function handleOnClick() {
    setNavOpen((prevNavOpen) => !prevNavOpen);
  }
  return (
    <div className="container col-span-10 col-start-3 mx-auto px-4 py-6">
      <div className="flex w-full items-center justify-between">
        <Link href="/">
          <Brand className="mb-4" />
        </Link>

        <button
          className="text-neutral h-8 w-8 md:hidden"
          onClick={handleOnClick}
        >
          {navOpen ? <UnionIcon /> : <MenuIcon />}
        </button>
      </div>
      <SearchBar />
    </div>
  );
}
