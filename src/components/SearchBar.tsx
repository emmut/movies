import SearchIcon from '@/icons/SearchIcon';
import { useSearchParams } from 'next/navigation';

export default function SearchBar() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  return (
    <form className="relative w-full lg:max-w-xs" action="/search">
      <SearchIcon className="absolute left-3 top-[50%] h-4 w-4 translate-y-[-50%] place-self-center text-zinc-500" />
      <label htmlFor="search-movies" className="sr-only">
        Search for movie titles
      </label>
      <input
        id="search-movies"
        className="w-full rounded-full bg-white py-1 pl-8 pr-3 text-zinc-500"
        name="q"
        type="search"
        spellCheck="false"
        placeholder="Search for movie titles"
        defaultValue={q}
      />
    </form>
  );
}
