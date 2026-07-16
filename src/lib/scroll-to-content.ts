// Matches the `scroll-m-5` (1.25rem) scroll-margin on `#content-container`.
const SCROLL_MARGIN = 20;

// Sub-pixel layout and smooth-scroll rounding settle within a few px of target.
const ON_TARGET_TOLERANCE = 4;

// Fires the settle check once scrolling has been quiet this long.
const SETTLE_MS = 100;

// Stop guarding after this; outlasts WebKit's post-`pushState` scroll with margin.
const GUARD_MS = 1200;

function scrollToTarget(behavior: ScrollBehavior) {
  const container = document.querySelector('#content-container');
  if (container) {
    container.scrollIntoView({ behavior, block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior });
  }
}

/** Signed distance from the target, in px (0 = on target). */
function offsetFromTarget() {
  const container = document.querySelector('#content-container');
  return container ? container.getBoundingClientRect().top - SCROLL_MARGIN : window.scrollY;
}

/**
 * Smoothly scrolls the results container (`#content-container`) to the top of
 * the viewport, falling back to the top of the page when it's absent. The
 * container's `scroll-margin` leaves a small gap above the first item.
 *
 * Call this from a user gesture (e.g. a pagination link's `onClick`).
 *
 * A single `scrollIntoView` isn't enough on WebKit/iOS Safari: paginating is a
 * soft navigation, and Safari runs its own scroll a few hundred ms after the
 * `pushState`, leaving the page partway off-target. Rather than guess when that
 * lands, we wait for scrolling to go quiet — ours or Safari's — then, if we're
 * off-target, snap to it instantly (no second animation, so no jank). A real
 * user scroll (wheel / touch / keydown) ends the guard so we never fight it.
 */
export function scrollToContent() {
  scrollToTarget('smooth');

  const guard = new AbortController();
  const { signal } = guard;
  let settleTimer: ReturnType<typeof setTimeout>;

  function onScroll() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (Math.abs(offsetFromTarget()) > ON_TARGET_TOLERANCE) {
        // `'instant'`, not `'auto'`: stay instant even under a global CSS
        // `scroll-behavior: smooth`, so the correction never animates a bounce.
        scrollToTarget('instant');
      }
    }, SETTLE_MS);
  }

  function endGuard() {
    guard.abort();
  }

  window.addEventListener('scroll', onScroll, { passive: true, signal });
  window.addEventListener('wheel', endGuard, { passive: true, signal });
  window.addEventListener('touchmove', endGuard, { passive: true, signal });
  window.addEventListener('keydown', endGuard, { signal });
  setTimeout(endGuard, GUARD_MS);
}
