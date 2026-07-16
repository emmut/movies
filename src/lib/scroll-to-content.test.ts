import { afterEach, describe, expect, it, vi } from 'vitest';

import { scrollToContent } from './scroll-to-content';

type ContainerStub = { scrollIntoView: ReturnType<typeof vi.fn>; top: number };

/**
 * Stubs the minimal `document`/`window` surface `scrollToContent` touches and
 * returns helpers to fire the listeners it registers. Listeners are registered
 * with an `AbortSignal`, so removal happens via the signal. `container.top` is
 * the results container's viewport-relative top; set it to the scroll-margin
 * (20) to represent "on target".
 */
function stubEnv(container: ContainerStub | null) {
  const listeners: Record<string, Set<() => void>> = {};
  const scrollTo = vi.fn();

  vi.stubGlobal('document', {
    querySelector: vi.fn().mockReturnValue(
      container
        ? {
            scrollIntoView: container.scrollIntoView,
            getBoundingClientRect: () => ({ top: container.top }),
          }
        : null,
    ),
  });
  vi.stubGlobal('window', {
    scrollY: 0,
    scrollTo,
    addEventListener: (type: string, fn: () => void, options?: { signal?: AbortSignal }) => {
      (listeners[type] ??= new Set()).add(fn);
      options?.signal?.addEventListener('abort', () => listeners[type]?.delete(fn), {
        once: true,
      });
    },
  });

  return {
    scrollTo,
    fire: (type: string) => listeners[type]?.forEach((fn) => fn()),
    listenerCount: () => Object.values(listeners).reduce((n, set) => n + set.size, 0),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('scrollToContent', () => {
  it('smooth-scrolls the results container to the top', () => {
    const scrollIntoView = vi.fn();
    stubEnv({ scrollIntoView, top: 20 });

    scrollToContent();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('falls back to the top of the page when no container is present', () => {
    const { scrollTo } = stubEnv(null);

    scrollToContent();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('re-asserts the target when a later scroll drifts off it', () => {
    const scrollIntoView = vi.fn();
    // Container sits 300px down: a soft-navigation scroll has drifted off target.
    const { fire } = stubEnv({ scrollIntoView, top: 300 });

    scrollToContent();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    fire('scroll');
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('leaves an on-target scroll alone', () => {
    const scrollIntoView = vi.fn();
    // Container top === scroll-margin: already on target.
    const { fire } = stubEnv({ scrollIntoView, top: 20 });

    scrollToContent();
    fire('scroll');

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('yields to the user and tears down its listeners on touchmove', () => {
    const scrollIntoView = vi.fn();
    const { fire, listenerCount } = stubEnv({ scrollIntoView, top: 300 });

    scrollToContent();
    fire('touchmove');
    expect(listenerCount()).toBe(0);

    // A drift after the user took over must not be corrected.
    fire('scroll');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('stops guarding after the guard window elapses', () => {
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
    const { fire, listenerCount } = stubEnv({ scrollIntoView, top: 300 });

    scrollToContent();
    expect(listenerCount()).toBeGreaterThan(0);

    vi.advanceTimersByTime(1200);
    expect(listenerCount()).toBe(0);

    fire('scroll');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('supersedes the previous guard when called again', () => {
    const scrollIntoView = vi.fn();
    const first = stubEnv({ scrollIntoView, top: 300 });

    scrollToContent();
    expect(first.listenerCount()).toBeGreaterThan(0);

    // A second click (fresh stubs, as after a re-render) replaces the guard:
    // the first guard's listeners are aborted, only the new ones remain.
    const second = stubEnv({ scrollIntoView, top: 300 });
    scrollToContent();

    expect(first.listenerCount()).toBe(0);
    expect(second.listenerCount()).toBeGreaterThan(0);
  });
});
