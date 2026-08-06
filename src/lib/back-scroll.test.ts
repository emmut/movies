import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearBackScroll,
  restoreBackScrollIfScheduled,
  saveBackScroll,
  scheduleBackScrollRestore,
} from './back-scroll';

function locationFrom(url: string) {
  const parsed = new URL(url);
  return { pathname: parsed.pathname, search: parsed.search };
}

function stubWindow({ url, scrollY = 0 }: { url: string; scrollY?: number }) {
  const store = new Map<string, string>();
  const scrollTo = vi.fn();
  vi.stubGlobal('window', {
    location: locationFrom(url),
    scrollY,
    scrollTo,
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    },
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  return { store, scrollTo };
}

function moveTo(url: string) {
  (window as unknown as { location: ReturnType<typeof locationFrom> }).location =
    locationFrom(url);
}

afterEach(function resetModuleState() {
  // Drain any schedule left behind so tests stay independent: a render away
  // from the scheduled destination drops it.
  stubWindow({ url: 'http://app.test/drain' });
  restoreBackScrollIfScheduled();
  vi.unstubAllGlobals();
});

describe('back scroll restore', () => {
  it('restores the recorded position at the destination', () => {
    const { scrollTo } = stubWindow({ url: 'http://app.test/discover?page=2', scrollY: 1500 });

    saveBackScroll();
    moveTo('http://app.test/movie/1');
    scheduleBackScrollRestore('/discover?page=2');
    moveTo('http://app.test/discover?page=2');
    restoreBackScrollIfScheduled();

    expect(scrollTo).toHaveBeenCalledWith({ top: 1500, behavior: 'instant' });
  });

  it('matches the destination regardless of query parameter order', () => {
    const { scrollTo } = stubWindow({
      url: 'http://app.test/discover?mediaType=tv&page=2',
      scrollY: 900,
    });

    saveBackScroll();
    moveTo('http://app.test/movie/1');
    scheduleBackScrollRestore('/discover?page=2&mediaType=tv');
    moveTo('http://app.test/discover?mediaType=tv&page=2');
    restoreBackScrollIfScheduled();

    expect(scrollTo).toHaveBeenCalledWith({ top: 900, behavior: 'instant' });
  });

  it('is one-shot: a second render does not restore again', () => {
    const { scrollTo } = stubWindow({ url: 'http://app.test/search?q=x', scrollY: 700 });

    saveBackScroll();
    scheduleBackScrollRestore('/search?q=x');
    restoreBackScrollIfScheduled();
    restoreBackScrollIfScheduled();

    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('drops the schedule when landing somewhere else', () => {
    const { scrollTo } = stubWindow({ url: 'http://app.test/discover', scrollY: 1200 });

    saveBackScroll();
    scheduleBackScrollRestore('/discover');
    moveTo('http://app.test/watchlist');
    restoreBackScrollIfScheduled();
    // Even reaching the destination later must not restore — the stale
    // schedule was dropped by the unrelated render.
    moveTo('http://app.test/discover');
    restoreBackScrollIfScheduled();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('does nothing without a recorded position', () => {
    const { scrollTo } = stubWindow({ url: 'http://app.test/discover' });

    scheduleBackScrollRestore('/discover?page=3');
    moveTo('http://app.test/discover?page=3');
    restoreBackScrollIfScheduled();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('clearing drops a previously recorded position (explicit back targets)', () => {
    const { scrollTo } = stubWindow({ url: 'http://app.test/search?q=x', scrollY: 481 });

    saveBackScroll();
    // The quick-search palette records /search?q=x as an explicit target from
    // another page — the old reading position must not survive that.
    moveTo('http://app.test/movie/1');
    clearBackScroll('/search?q=x');

    expect(scheduleBackScrollRestore('/search?q=x')).toBe(false);
    moveTo('http://app.test/search?q=x');
    restoreBackScrollIfScheduled();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('ignores a recorded position of zero', () => {
    const { scrollTo } = stubWindow({ url: 'http://app.test/discover', scrollY: 0 });

    saveBackScroll();
    scheduleBackScrollRestore('/discover');
    restoreBackScrollIfScheduled();

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
