import Image from 'next/image';

function Footer() {
  return (
    <footer className="mt-auto flex flex-col items-center gap-4 py-16">
      <p className="text-muted-foreground/80 p-2 text-center text-xs italic">
        This product uses the TMDb API but is not endorsed or certified by TMDb
      </p>

      <a
        href="https://www.themoviedb.org/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src="/tmdb-logo.svg"
          alt="TMDb Logo"
          width={150}
          height={13}
          className="mx-auto"
          loading="eager"
        />
      </a>
    </footer>
  );
}

export { Footer };
