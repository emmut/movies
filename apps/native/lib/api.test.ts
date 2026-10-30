import { focusManager, onlineManager } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const native = vi.hoisted(() => ({
  platform: 'web',
  remove: vi.fn(),
  addListener: vi.fn(),
}));
vi.mock('@native/lib/auth-client', () => ({ authClient: { getCookie: async () => '' } }));
vi.mock('@native/lib/connections', () => ({ serverUrl: 'http://localhost:3001' }));
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return native.platform;
    },
  },
  AppState: { addEventListener: native.addListener },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  native.addListener.mockReset();
  native.remove.mockReset();
});

describe('query focus integration', () => {
  it('preserves the browser focus and connectivity listeners', async () => {
    native.platform = 'web';
    const focus = vi.spyOn(focusManager, 'setEventListener');
    const online = vi.spyOn(onlineManager, 'setOnline');
    await import('@native/lib/api');
    expect(focus).not.toHaveBeenCalled();
    expect(online).not.toHaveBeenCalled();
    expect(native.addListener).not.toHaveBeenCalled();
  });
  it('tracks native foreground changes and removes its subscription', async () => {
    native.platform = 'ios';
    native.addListener.mockReturnValue({ remove: native.remove });
    const focused = vi.fn();
    let cleanup: (() => void) | undefined;
    vi.spyOn(focusManager, 'setEventListener').mockImplementation((listen) => {
      cleanup = listen(focused);
    });
    const online = vi.spyOn(onlineManager, 'setOnline');
    await import('@native/lib/api');
    const [event, listener] = native.addListener.mock.calls[0];
    expect(event).toBe('change');
    listener('active');
    listener('background');
    expect(focused.mock.calls).toEqual([[true], [false]]);
    expect(online).toHaveBeenCalledWith(true);
    cleanup?.();
    expect(native.remove).toHaveBeenCalledOnce();
  });
});
