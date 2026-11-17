import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { scheduleScrollToContent, scrollToContentIfScheduled } from './scroll-to-content';

function stubBrowser({
  url = 'http://app.test/discover',
  hasContent = true,
  reducedMotion = true,
} = {}) {
  const location = { href: url };
  const bodyStyle = { minHeight: '' };
  const events = new EventTarget();
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  let now = 0;
  const viewport = {
    location,
    scrollY: 2000,
    innerHeight: 800,
    matchMedia: vi.fn(() => ({ matches: reducedMotion })),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: vi.fn(events.removeEventListener.bind(events)),
    scrollTo: vi.fn(({ top }: ScrollToOptions) => {
      viewport.scrollY = top ?? 0;
    }),
  };
  const root = { scrollHeight: 6000 };
  const results = {
    getBoundingClientRect: vi.fn(() => ({ top: 300 - viewport.scrollY })),
  };
  vi.stubGlobal('window', viewport);
  vi.stubGlobal('document', {
    body: { style: bodyStyle },
    documentElement: root,
    getElementById: (id: string) => (id === 'content' && hasContent ? results : null),
  });
  vi.stubGlobal('getComputedStyle', (element: unknown) => ({
    scrollPaddingTop: element === root ? '64px' : '0px',
    scrollMarginTop: element === results ? '20px' : '0px',
  }));
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));

  function advance(timestamp: number) {
    now = timestamp;
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) {
      callback(timestamp);
    }
  }

  return {
    location,
    bodyStyle,
    viewport,
    results,
    frames,
    events,
    advance,
    mountContent() {
      hasContent = true;
    },
    navigate() {
      scheduleScrollToContent('?page=2');
      location.href = 'http://app.test/discover?page=2';
      scrollToContentIfScheduled();
    },
  };
}

afterEach(() => {
  stubBrowser({ url: 'http://app.test/drain' });
  scheduleScrollToContent('/cancel');
  scrollToContentIfScheduled();
  vi.unstubAllGlobals();
});

describe('scrollToContentIfScheduled', () => {
  it('does nothing when no scroll was scheduled', () => {
    const { viewport } = stubBrowser();
    scrollToContentIfScheduled();
    expect(viewport.scrollTo).not.toHaveBeenCalled();
  });

  it('respects the header padding and results margin when reduced motion is requested', () => {
    const browser = stubBrowser();
    browser.navigate();
    expect(browser.viewport.scrollTo).toHaveBeenCalledWith({ top: 216, behavior: 'instant' });
    expect(browser.frames.size).toBe(0);
  });

  it('holds the document height until the destination has been laid out', () => {
    const browser = stubBrowser();
    const holdAtLayout: string[] = [];
    browser.results.getBoundingClientRect.mockImplementation(() => {
      holdAtLayout.push(browser.bodyStyle.minHeight);
      return { top: -1700 };
    });
    scheduleScrollToContent('?page=2');
    expect(browser.bodyStyle.minHeight).toBe('6000px');
    browser.location.href = 'http://app.test/discover?page=2';
    scrollToContentIfScheduled();
    expect(holdAtLayout[0]).toBe('6000px');
    expect(browser.bodyStyle.minHeight).toBe('');
  });

  it('consumes the schedule so a later render does not scroll again', () => {
    const browser = stubBrowser();
    browser.navigate();
    scrollToContentIfScheduled();
    expect(browser.viewport.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('waits for the results anchor to mount', () => {
    const browser = stubBrowser({ hasContent: false });
    browser.navigate();
    expect(browser.viewport.scrollTo).not.toHaveBeenCalled();
    browser.mountContent();
    scrollToContentIfScheduled();
    expect(browser.viewport.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('matches the destination regardless of parameter order', () => {
    const browser = stubBrowser();
    scheduleScrollToContent('?mediaType=tv&page=2');
    browser.location.href = 'http://app.test/discover?page=2&mediaType=tv';
    scrollToContentIfScheduled();
    expect(browser.viewport.scrollTo).toHaveBeenCalledTimes(1);
  });

  it.each(['/watchlist', '/discover?page=2&sort_by=vote_average.desc'])(
    'drops an abandoned schedule after navigating to %s',
    (destination) => {
      const browser = stubBrowser();
      scheduleScrollToContent('?page=2');
      browser.location.href = 'http://app.test' + destination;
      scrollToContentIfScheduled();
      expect(browser.bodyStyle.minHeight).toBe('');
      browser.location.href = 'http://app.test/discover?page=2';
      scrollToContentIfScheduled();
      expect(browser.viewport.scrollTo).not.toHaveBeenCalled();
    },
  );
});

describe('pagination scroll animation', () => {
  it('moves gently for a full second before stopping below the header', () => {
    const browser = stubBrowser({ reducedMotion: false });
    browser.navigate();
    expect(browser.viewport.scrollY).toBe(2000);
    browser.advance(500);
    expect(browser.viewport.scrollY).toBeGreaterThan(216);
    expect(browser.viewport.scrollY).toBeLessThan(2000);
    browser.advance(900);
    expect(browser.viewport.scrollY).toBeGreaterThan(216);
    expect(browser.frames.size).toBe(1);
    browser.advance(1000);
    expect(browser.viewport.scrollY).toBe(216);
    expect(browser.frames.size).toBe(0);
    expect(browser.viewport.removeEventListener).toHaveBeenCalledTimes(3);
  });

  it.each(['wheel', 'touchstart', 'keydown'])('lets %s interrupt the animation', (event) => {
    const browser = stubBrowser({ reducedMotion: false });
    browser.navigate();
    browser.advance(200);
    const position = browser.viewport.scrollY;
    browser.events.dispatchEvent(new Event(event));
    browser.advance(1000);
    expect(browser.viewport.scrollY).toBe(position);
    expect(browser.frames.size).toBe(0);
  });

  it('stops when the user navigates elsewhere', () => {
    const browser = stubBrowser({ reducedMotion: false });
    browser.navigate();
    browser.advance(200);
    browser.location.href = 'http://app.test/movie/42';
    browser.advance(400);
    expect(browser.viewport.scrollTo).toHaveBeenCalledTimes(1);
    expect(browser.frames.size).toBe(0);
  });

  it('cancels an earlier animation when another pagination starts', () => {
    const browser = stubBrowser({ reducedMotion: false });
    browser.navigate();
    browser.advance(200);
    scheduleScrollToContent('?page=3');
    browser.advance(400);
    expect(browser.viewport.scrollTo).toHaveBeenCalledTimes(1);
    expect(browser.frames.size).toBe(0);
  });
});
