import { createRegionStore } from '@native/lib/region-store';
import { describe, expect, it, vi } from 'vitest';

describe('session region', () => {
  it('defaults to Sweden and keeps the selection between screen subscriptions', () => {
    const store = createRegionStore();
    expect(store.getSnapshot()).toBe('SE');
    const firstScreen = vi.fn();
    const unsubscribe = store.subscribe(firstScreen);
    store.setRegion('US');
    expect(firstScreen).toHaveBeenCalledOnce();
    unsubscribe();
    const returningScreen = vi.fn();
    store.subscribe(returningScreen);
    expect(store.getSnapshot()).toBe('US');
    store.setRegion('GB');
    expect(firstScreen).toHaveBeenCalledOnce();
    expect(returningScreen).toHaveBeenCalledOnce();
  });
  it('does not notify for unchanged values or mutate on invalid input', () => {
    const store = createRegionStore('US');
    const listener = vi.fn();
    store.subscribe(listener);
    store.setRegion('US');
    expect(() => store.setRegion('XX')).toThrow();
    expect(store.getSnapshot()).toBe('US');
    expect(listener).not.toHaveBeenCalled();
  });
});
