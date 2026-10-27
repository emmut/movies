import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { subscribeToPreferenceRefresh } from './preference-refresh';

afterEach(() => vi.useRealTimers());

describe('cross-client preference refresh', () => {
  it('coalesces focus and visibility return and ignores hidden pages', () => {
    vi.useFakeTimers();
    const browser = new EventTarget();
    const page = Object.assign(new EventTarget(), {
      visibilityState: 'hidden' as DocumentVisibilityState,
    });
    const refresh = vi.fn();
    const stop = subscribeToPreferenceRefresh(refresh, browser, page);
    browser.dispatchEvent(new Event('focus'));
    vi.runAllTimers();
    expect(refresh).not.toHaveBeenCalled();
    page.visibilityState = 'visible';
    page.dispatchEvent(new Event('visibilitychange'));
    browser.dispatchEvent(new Event('focus'));
    vi.runAllTimers();
    expect(refresh).toHaveBeenCalledTimes(1);
    stop();
    browser.dispatchEvent(new Event('focus'));
    vi.runAllTimers();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it('cancels a queued refresh on unmount', () => {
    vi.useFakeTimers();
    const browser = new EventTarget();
    const page = Object.assign(new EventTarget(), {
      visibilityState: 'visible' as DocumentVisibilityState,
    });
    const refresh = vi.fn();
    const stop = subscribeToPreferenceRefresh(refresh, browser, page);
    browser.dispatchEvent(new Event('focus'));
    stop();
    vi.runAllTimers();
    expect(refresh).not.toHaveBeenCalled();
  });
});
