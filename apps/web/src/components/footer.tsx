import Image from 'next/image';

function Footer() {
  return (
    // Solid background (plus `relative` to lift it in paint order) so page
    // content streaming in mid-transition never shows through the footer.
    <footer className="relative mt-auto bg-background pt-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 border-t border-zinc-800/60 px-4 pt-10 pb-10 text-center">
        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
          <Image
            src="/tmdb-logo.svg"
            alt="TMDb Logo"
            width={120}
            height={10}
            className="mx-auto opacity-80 transition-opacity hover:opacity-100"
            loading="eager"
            unoptimized
          />
        </a>

        <p className="text-xs leading-relaxed text-muted-foreground/80">
          This product uses the TMDb API but is not endorsed or certified by TMDb. Ratings
          information courtesy of{' '}
          <a
            href="https://developer.imdb.com/non-commercial-datasets/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/40 underline-offset-2 hover:text-foreground"
          >
            IMDb
          </a>{' '}
          (imdb.com) — used with permission.
        </p>
      </div>
    </footer>
  );
}

export { Footer };
