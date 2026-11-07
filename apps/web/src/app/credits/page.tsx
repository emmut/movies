import Image from 'next/image';

export const metadata = { title: 'Credits' };

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <h1 className="text-3xl font-semibold">Credits</h1>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">The Movie Database</h2>
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
          <Image
            src="/tmdb-logo.svg"
            alt="TMDB"
            width={120}
            height={10}
            className="h-auto"
            unoptimized
          />
        </a>
        <p className="text-sm text-zinc-400">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <p className="text-sm text-zinc-400">
          Movie and TV metadata and artwork are provided by TMDB.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">JustWatch</h2>
        <p className="text-sm text-zinc-400">
          Streaming availability is provided by{' '}
          <a href="https://www.justwatch.com" className="underline">
            JustWatch
          </a>{' '}
          via TMDB. Availability varies by country and may change.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Wikidata</h2>
        <p className="text-sm text-zinc-400">
          Some provider title identifiers come from{' '}
          <a href="https://www.wikidata.org" className="underline">
            Wikidata
          </a>
          , whose structured data is available under{' '}
          <a href="https://www.wikidata.org/wiki/Wikidata:Licensing" className="underline">
            CC0
          </a>
          . These identifiers help us link directly to titles; regional availability comes from
          JustWatch via TMDB.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">IMDb</h2>
        <p className="text-sm text-zinc-400">
          Ratings information courtesy of{' '}
          <a href="https://developer.imdb.com/non-commercial-datasets/" className="underline">
            IMDb
          </a>{' '}
          (imdb.com) — used with permission.
        </p>
      </section>
    </div>
  );
}
