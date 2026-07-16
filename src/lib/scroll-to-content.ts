// Matches the `scroll-m-5` (1.25rem) scroll-margin on `#content-container`:
// resting with the container this far below the viewport top is on-target.
const SCROLL_MARGIN = 20;

// Sub-pixel layout and smooth-scroll rounding keep the settled position within
// a few px of the target; anything past this is a scroll we didn't ask for.
const ON_TARGET_TOLERANCE = 4;

// How long to defend the target after the click. WebKit fires its own scroll
// a few hundred ms after a soft navigation's `pushState`; the window must
// outlast that, with margin for slow devices.
const GUARD_MS = 1200;

// The one guard allowed at a time; a new click supersedes the previous guard.
let activeGuard: AbortController | null = null;

function getContainer() {
  return document.querySelector('#content-container');
}

function scrollToTarget() {
  const container = getContainer();
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/** Signed distance from the target position, in px (0 = on target). */
function offsetFromTarget() {
  const container = getContainer();
  return container ? container.getBoundingClientRect().top - SCROLL_MARGIN : window.scrollY;
}

/**
 * Scrolls the results container (`#content-container`) to the top of the
 * viewport, falling back to the top of the page when no container is present.
 * The container's `scroll-margin` leaves a small gap above the first item.
 *
 * Call this from a user gesture (e.g. a pagination link's `onClick`) rather than
 * an effect: the container's position is stable across page changes, so scrolling
 * on click is reliable and never fires on unrelated navigation (back / forward,
 * deep links) the way a `page`-watching effect does.
 *
 * A single `scrollIntoView` isn't enough on WebKit/iOS Safari: paginating is a
 * soft navigation, and Safari runs its own scroll ~300ms after the `pushState`,
 * landing partway up the page and clobbering ours. So for a short window after
 * scrolling, any scroll that drifts off the target is steered back — unless it
 * came from the user (wheel / touchmove / keydown), which ends the guard.
 */
export function scrollToContent() {
  scrollToTarget();

  activeGuard?.abort();
  const guard = new AbortController();
  activeGuard = guard;

  function endGuard() {
    guard.abort();
  }

  function steerBackIfOffTarget() {
    if (Math.abs(offsetFromTarget()) > ON_TARGET_TOLERANCE) {
      scrollToTarget();
    }
  }

  const { signal } = guard;
  window.addEventListener('scroll', steerBackIfOffTarget, { passive: true, signal });
  // `touchmove` rather than `touchstart`, so a stray tap doesn't end the guard.
  window.addEventListener('wheel', endGuard, { passive: true, signal });
  window.addEventListener('touchmove', endGuard, { passive: true, signal });
  window.addEventListener('keydown', endGuard, { signal });
  setTimeout(endGuard, GUARD_MS);
}
