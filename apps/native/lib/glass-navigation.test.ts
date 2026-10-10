import { glassHeaderOptions, navigationColor } from '@native/lib/glass-navigation';
import { describe, expect, it } from 'vitest';

describe('translucent native catalog navigation', () => {
  it('allows the real iOS glass background to render over content without an opaque header', () => {
    expect(glassHeaderOptions('ios', true)).toEqual({
      headerTransparent: true,
      headerShadowVisible: false,
      headerBlurEffect: undefined,
    });
  });
  it('uses native material on iOS versions without the glass API', () => {
    expect(glassHeaderOptions('ios', false)).toEqual({
      headerTransparent: true,
      headerShadowVisible: false,
      headerBlurEffect: 'systemUltraThinMaterial',
    });
  });
  it.each(['android', 'web'])('keeps platform-native header placement on %s', (platform) => {
    expect(glassHeaderOptions(platform, false)).toEqual({
      headerTransparent: false,
      headerShadowVisible: false,
      headerBlurEffect: undefined,
    });
  });
});

it('passes resolved colors and ignores absent or non-color token values', () => {
  expect(navigationColor('#ffffff')).toBe('#ffffff');
  expect(navigationColor(undefined)).toBeUndefined();
  expect(navigationColor(0)).toBeUndefined();
});
