import SearchIcon from '@/icons/SearchIcon';

export default function SearchBar() {
  return (
    <form className="relative w-full max-w-xs" action="/search">
      <SearchIcon className="absolute left-3 top-[50%] h-4 w-4 translate-y-[-50%] place-self-center text-zinc-500" />
      <label htmlFor="search-movies" className="sr-only">
        Search for movie titles
      </label>
      <input
        id="search-movies"
        className="rounded-full bg-white py-1 pl-8 pr-3 text-sm text-zinc-500"
        name="q"
        type="search"
        spellCheck="false"
        placeholder="Search for movie titles"
      />
    </form>
  );
}
