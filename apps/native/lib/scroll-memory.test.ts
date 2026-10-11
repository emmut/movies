import { createScrollMemory } from '@native/lib/scroll-memory';
import { describe, expect, it } from 'vitest';

describe('scroll memory across pages and navigation entries', () => {
  it('starts new pages at zero and restores earlier pages independently', () => {
    const positions = new Map<string, number>();
    const memory = createScrollMemory('page:1', positions);
    memory.offset = 2208;
    memory.navigationOffset = 2208;
    memory.remember();
    expect(memory.select('page:2')).toBe(true);
    expect(memory).toMatchObject({ offset: 0, remembered: false, navigationOffset: null });
    memory.offset = 200;
    memory.remember();
    expect(memory.select('page:1')).toBe(true);
    expect(memory).toMatchObject({ offset: 2208, remembered: true });
    expect(positions.get('page:2')).toBe(200);
  });
  it('keeps the current reading position when refocusing the same surface', () => {
    const memory = createScrollMemory('entry:1', new Map([['entry:1', 1000]]));
    memory.offset = 1251;
    memory.navigationOffset = 1251;
    expect(memory.select('entry:1')).toBe(false);
    expect(memory).toMatchObject({ offset: 1251, navigationOffset: 1251, remembered: true });
  });
  it('starts a fresh title entry at zero even when an earlier entry was remembered', () => {
    const positions = new Map([['entry:1:movie:42', 1000]]);
    expect(createScrollMemory('entry:2:movie:42', positions)).toMatchObject({
      offset: 0,
      remembered: false,
    });
  });
});
