// Coordinates "paginate, then scroll to the top of the results".
//
// The scroll can't happen at click time: the new page renders later (often
// behind a `<Suspense key={page}>` fallback) and the document height changes
// under an early scroll. Instead the click schedules the scroll here and
// PaginationControls performs it in an effect once the new page is on screen.
// Module state rather than React state: the Suspense swap remounts the
// controls, which would lose anything stored in the component.

let scrollScheduled = false;

/** Called at click time, before the pagination navigation starts. */
export function scheduleScrollToContent() {
  scrollScheduled = true;
}

/**
 * Scrolls the paginated results (`#content`) into view if a pagination click
 * scheduled it; no-op otherwise. The target's `scroll-m-*` class provides the
 * small gap above the first item.
 */
export function scrollToContentIfScheduled() {
  if (!scrollScheduled) {
    return;
  }
  scrollScheduled = false;
  document.getElementById('content')?.scrollIntoView();
}
