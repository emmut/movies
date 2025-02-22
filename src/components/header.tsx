import Link from 'next/link';
import { Suspense } from 'react';
import { useNavigationContext } from '@/providers/navigation';
import MenuIcon from '@/icons/MenuIcon';
import UnionIcon from '@/icons/UnionIcon';
import SearchBar from '@/components/search-bar';
import Brand from '@/components/brand';
import Spinner from '@/components/spinner';

export default function Header() {
  const { navOpen, handleOnClick } = useNavigationContext();

  return (
    <header className="sticky top-0 z-20 bg-neutral-800 py-4">
      <div className="desktop:mb-0 mb-4 flex w-full items-baseline justify-between">
        <Link className="desktop:hidden" href="/" title="Go to home">
          <Brand />
        </Link>

        <button
          className="text-neutral desktop:hidden relative grid h-8 w-8 place-items-center"
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
      <Suspense fallback={<Spinner />}>
        <SearchBar />
      </Suspense>
    </header>
  );
}
