/**
 * Heading row for a homepage media section. Static markup (no data), so it
 * renders identically in the page and its loading skeleton.
 */
export function MediaSectionHeader({ heading, caption }: { heading: string; caption: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">{heading}</h2>
      <p className="hidden text-sm text-muted-foreground sm:block">{caption}</p>
    </div>
  );
}

/**
 * Heading row for the trending section at the top of the homepage.
 */
export function TrendingHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Trending Now</h1>
      <p className="hidden text-sm text-muted-foreground sm:block">What everyone&#39;s watching</p>
    </div>
  );
}
