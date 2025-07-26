import SearchBox from '@/components/search-box';
import { Button } from '@/components/ui/button';
import { Film, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-8">
        <Film className="mx-auto mb-4 h-20 w-20 text-zinc-400" />
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          !
        </div>
      </div>

      <h1 className="mb-4 text-6xl font-bold text-zinc-200">404</h1>

      <h2 className="mb-4 text-2xl font-semibold text-zinc-300">
        Page Not Found
      </h2>

      <p className="mb-8 max-w-md text-zinc-400">
        The page you are looking for seems to have vanished like a movie from
        the theater. It might have been moved or no longer exists.
      </p>

      <div className="mb-8">
        <SearchBox autoFocus />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/" className="inline-flex items-center gap-2">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg">
          <Link href="/discover" className="inline-flex items-center gap-2">
            <Film className="h-4 w-4" />
            Discover Movies
          </Link>
        </Button>
      </div>
    </div>
  );
}
