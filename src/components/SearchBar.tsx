import { useSearchParams } from 'next/navigation';
import SearchIcon from '@/icons/SearchIcon';

export default function SearchBar() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  return (
    <form className="relative w-full lg:max-w-xs" action="/search">
      <SearchIcon className="absolute top-[50%] left-3 h-4 w-4 translate-y-[-50%] place-self-center text-zinc-500" />
      <label htmlFor="search-movies" className="sr-only">
        Search for movie titles
      </label>
      <input
        id="search-movies"
        className="w-full rounded-full bg-white py-1 pr-3 pl-8 text-zinc-500"
        name="q"
        type="search"
        spellCheck="false"
        placeholder="Search for movie titles"
        defaultValue={q}
      />
    </form>
  );
}
