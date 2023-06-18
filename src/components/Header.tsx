import Brand from '@/components/Brand';
import SearchBar from '@/components/SearchBar';
import MenuIcon from '@/icons/MenuIcon';
import UnionIcon from '@/icons/UnionIcon';

export default function Header() {
  const navOpen = false;

  return (
    <div className="container col-span-10 col-start-3 mx-auto px-4 py-8">
      <div className="flex">
        <Brand />
        <button>{navOpen ? <MenuIcon /> : <UnionIcon />}</button>
      </div>
      <SearchBar />
    </div>
  );
}
