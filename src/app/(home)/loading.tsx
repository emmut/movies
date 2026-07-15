import Trending from '@/app/trending';
import ItemGrid from '@/components/item-grid';
import { ItemSlider } from '@/components/ui/item-slider';

import { HOME_SECTIONS, MediaSectionHeader, TrendingHeader } from './sections';

/**
 * Loading skeleton for the homepage.
 *
 * Renders the exact same shell as the page — real section headings in the same
 * order, with skeleton sliders in place of the async media rows — so the layout
 * doesn't shift when the real content streams in.
 *
 * All sections stay in the DOM (so the section count matches the page and
 * nothing jumps on swap), but the stack is clipped to roughly one viewport.
 * A skeleton taller than the viewport keeps the previous route's scroll offset
 * on a client navigation — Next only resets scroll once real content arrives —
 * which shows it "chopped off"; a short one lets the browser clamp to the top.
 */
export default function Loading() {
  return (
    <div className="max-h-[80dvh] space-y-8 overflow-hidden">
      <section className="space-y-4">
        <TrendingHeader />

        <div className="grid gap-4 lg:grid-cols-2">
          <Trending.Skeleton />
          <Trending.Skeleton />
        </div>
      </section>

      {HOME_SECTIONS.map((section) => (
        <section key={section.heading} className="space-y-4">
          <MediaSectionHeader heading={section.heading} caption={section.caption} />

          <ItemSlider>
            <ItemGrid.Skeletons />
          </ItemSlider>
        </section>
      ))}
    </div>
  );
}
