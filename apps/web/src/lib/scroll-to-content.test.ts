import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { scheduleScrollToContent, scrollToContentIfScheduled } from './scroll-to-content';

function stubBrowser({
  url,
  contentElement,
  reducedMotion = false,
}: {
  url: string;
  reducedMotion?: boolean;
  contentElement: { scrollIntoView: () => void; getBoundingClientRect?: () => void } | null;
}) {
  const results = contentElement && {
    getBoundingClientRect: vi.fn(),
    ...contentElement,
  };
  const location = { href: url };
  const bodyStyle = { minHeight: '', overflowAnchor: '' };
  const documentEvents = new EventTarget();
  const windowEvents = new EventTarget();
  vi.stubGlobal('window', {
    location,
    matchMedia: vi.fn(() => ({ matches: reducedMotion })),
    addEventListener: windowEvents.addEventListener.bind(windowEvents),
    removeEventListener: windowEvents.removeEventListener.bind(windowEvents),
  });
  vi.stubGlobal('document', {
    body: { style: bodyStyle },
    documentElement: { scrollHeight: 2400 },
    addEventListener: documentEvents.addEventListener.bind(documentEvents),
    removeEventListener: documentEvents.removeEventListener.bind(documentEvents),
    getElementById: vi.fn(function getElementById(id: string) {
      return id === 'content' ? results : null;
    }),
  });

  return { bodyStyle, location, documentEvents, windowEvents };
}

beforeEach(() => vi.useFakeTimers());

afterEach(function resetModuleState() {
  // Drain any schedule left behind so tests stay independent: a render away
  // from the scheduled destination clears it.
  scheduleScrollToContent('/cancel');
  stubBrowser({ url: 'http://app.test/drain', contentElement: null });
  scrollToContentIfScheduled();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('scrollToContentIfScheduled', () => {
  it('lets the browser handle reduced motion without an animation loop', () => {
    const scrollIntoView = vi.fn();
    const requestFrame = vi.fn();
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    stubBrowser({
      url: 'http://app.test/discover?page=2',
      contentElement: { scrollIntoView },
      reducedMotion: true,
    });
    scheduleScrollToContent('?page=2');
    scrollToContentIfScheduled();
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: 'instant', block: 'start' });
    expect(requestFrame).not.toHaveBeenCalled();
  });

  it('delegates smooth scrolling once instead of driving each frame from JavaScript', () => {
    const scrollIntoView = vi.fn();
    const requestFrame = vi.fn();
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    stubBrowser({ url: 'http://app.test/discover?page=2', contentElement: { scrollIntoView } });
    scheduleScrollToContent('?page=2');
    scrollToContentIfScheduled();
    scrollToContentIfScheduled();
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: 'smooth', block: 'start' });
    expect(requestFrame).not.toHaveBeenCalled();
  });

  it('does nothing when no scroll was scheduled', () => {
    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/discover', contentElement: { scrollIntoView } });

    scrollToContentIfScheduled();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('scrolls #content into view once the scheduled destination renders', () => {
    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/discover', contentElement: { scrollIntoView } });

    scheduleScrollToContent('?page=2');
    stubBrowser({ url: 'http://app.test/discover?page=2', contentElement: { scrollIntoView } });
    scrollToContentIfScheduled();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('keeps the page height and suppresses anchoring until native scrolling ends', () => {
    const scrollIntoView = vi.fn();
    const { bodyStyle, location, documentEvents } = stubBrowser({
      url: 'http://app.test/discover',
      contentElement: { scrollIntoView },
    });

    scheduleScrollToContent('?page=2');
    expect(bodyStyle.minHeight).toBe('2400px');
    expect(bodyStyle.overflowAnchor).toBe('none');

    location.href = 'http://app.test/discover?page=2';
    scrollToContentIfScheduled();

    expect(bodyStyle.minHeight).toBe('2400px');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    documentEvents.dispatchEvent(new Event('scrollend'));
    expect(bodyStyle.minHeight).toBe('');
    expect(bodyStyle.overflowAnchor).toBe('');
  });

  it('lays out the new page while the height hold is still in place', () => {
    // Record the hold each time layout is forced, as WebKit lays out on read.
    const holdAtLayout: string[] = [];
    const { bodyStyle, location } = stubBrowser({
      url: 'http://app.test/discover',
      contentElement: {
        scrollIntoView: vi.fn(),
        getBoundingClientRect: vi.fn(function getBoundingClientRect() {
          holdAtLayout.push(bodyStyle.minHeight);
        }),
      },
    });
    scheduleScrollToContent('?page=2');

    location.href = 'http://app.test/discover?page=2';
    scrollToContentIfScheduled();

    expect(holdAtLayout).toEqual(['2400px']);
    expect(bodyStyle.minHeight).toBe('2400px');
  });

  it('releases the height hold after scrolling is idle when scrollend is unavailable', () => {
    const { bodyStyle, documentEvents } = stubBrowser({
      url: 'http://app.test/discover?page=2',
      contentElement: { scrollIntoView: vi.fn() },
    });
    scheduleScrollToContent('?page=2');
    scrollToContentIfScheduled();
    vi.advanceTimersByTime(150);
    documentEvents.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(150);
    expect(bodyStyle.minHeight).toBe('2400px');
    vi.advanceTimersByTime(50);
    expect(bodyStyle.minHeight).toBe('');
    expect(bodyStyle.overflowAnchor).toBe('');
  });

  it('restores the previous layout styles when scrolling does not move the viewport', () => {
    const { bodyStyle } = stubBrowser({
      url: 'http://app.test/discover?page=2',
      contentElement: { scrollIntoView: vi.fn() },
    });
    bodyStyle.minHeight = '100vh';
    bodyStyle.overflowAnchor = 'auto';
    scheduleScrollToContent('?page=2');
    scrollToContentIfScheduled();
    vi.advanceTimersByTime(200);
    expect(bodyStyle).toEqual({ minHeight: '100vh', overflowAnchor: 'auto' });
  });

  it('does not let a previous scroll completion release the next page height hold', () => {
    const { bodyStyle, documentEvents } = stubBrowser({
      url: 'http://app.test/discover?page=2',
      contentElement: { scrollIntoView: vi.fn() },
    });
    scheduleScrollToContent('?page=2');
    scrollToContentIfScheduled();
    scheduleScrollToContent('?page=3');
    documentEvents.dispatchEvent(new Event('scrollend'));
    vi.advanceTimersByTime(500);
    expect(bodyStyle.minHeight).toBe('2400px');
  });

  it('cleans up the layout hold when browser history interrupts a scroll', () => {
    const { bodyStyle, windowEvents } = stubBrowser({
      url: 'http://app.test/discover?page=2',
      contentElement: { scrollIntoView: vi.fn() },
    });
    scheduleScrollToContent('?page=2');
    scrollToContentIfScheduled();
    windowEvents.dispatchEvent(new Event('popstate'));
    expect(bodyStyle.minHeight).toBe('');
    expect(bodyStyle.overflowAnchor).toBe('');
  });

  it('consumes the schedule so a later render does not scroll again', () => {
    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/discover?page=2', contentElement: { scrollIntoView } });

    scheduleScrollToContent('?page=2');
    scrollToContentIfScheduled();
    scrollToContentIfScheduled();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('keeps the schedule while #content is missing and scrolls once it mounts', () => {
    stubBrowser({ url: 'http://app.test/lists?page=3', contentElement: null });

    scheduleScrollToContent('/lists?page=3');
    expect(scrollToContentIfScheduled).not.toThrow();

    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/lists?page=3', contentElement: { scrollIntoView } });
    scrollToContentIfScheduled();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('does not scroll when a superseding query state lands on the same page number', () => {
    stubBrowser({ url: 'http://app.test/discover?page=2', contentElement: null });
    scheduleScrollToContent('?page=1');

    // A filter change also resolves to a page-1 result set on the same
    // pathname — that is a different destination, not the scheduled one.
    const scrollIntoView = vi.fn();
    stubBrowser({
      url: 'http://app.test/discover?page=1&sort_by=vote_average.desc',
      contentElement: { scrollIntoView },
    });
    scrollToContentIfScheduled();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('matches the destination regardless of query parameter order', () => {
    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/discover?mediaType=tv&page=1', contentElement: null });
    scheduleScrollToContent('?mediaType=tv&page=2');

    stubBrowser({
      url: 'http://app.test/discover?page=2&mediaType=tv',
      contentElement: { scrollIntoView },
    });
    scrollToContentIfScheduled();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('drops an abandoned schedule instead of scrolling an unrelated page', () => {
    stubBrowser({ url: 'http://app.test/discover', contentElement: null });
    scheduleScrollToContent('?page=3');

    // The navigation never landed; the next render happens elsewhere.
    const scrollIntoView = vi.fn();
    stubBrowser({ url: 'http://app.test/watchlist', contentElement: { scrollIntoView } });
    scrollToContentIfScheduled();
    expect(scrollIntoView).not.toHaveBeenCalled();

    // Even reaching the original destination later must not scroll — the
    // stale schedule was cleared by the unrelated render.
    stubBrowser({ url: 'http://app.test/discover?page=3', contentElement: { scrollIntoView } });
    scrollToContentIfScheduled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
