import { describe, expect, it } from 'vitest';

import { moveIdToIndex, sameIdOrder } from './list-order';

describe('sameIdOrder', () => {
  it('is true for identical sequences', () => {
    expect(sameIdOrder(['a', 'b'], ['a', 'b'])).toBe(true);
  });

  it('is true for two empty sequences', () => {
    expect(sameIdOrder([], [])).toBe(true);
  });

  it('is false when the order differs', () => {
    expect(sameIdOrder(['a', 'b'], ['b', 'a'])).toBe(false);
  });

  it('is false when the lengths differ', () => {
    expect(sameIdOrder(['a'], ['a', 'b'])).toBe(false);
  });
});

describe('moveIdToIndex', () => {
  it('moves an id forward', () => {
    expect(moveIdToIndex(['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an id backward', () => {
    expect(moveIdToIndex(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b']);
  });

  it('clamps an index past the end', () => {
    expect(moveIdToIndex(['a', 'b', 'c'], 'a', 99)).toEqual(['b', 'c', 'a']);
  });

  it('clamps a negative index to the start', () => {
    expect(moveIdToIndex(['a', 'b', 'c'], 'b', -5)).toEqual(['b', 'a', 'c']);
  });

  it('returns the same order when the target equals the current index', () => {
    expect(moveIdToIndex(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'b', 'c']);
  });

  it('returns null when the id is absent', () => {
    expect(moveIdToIndex(['a', 'b'], 'x', 0)).toBeNull();
  });

  it('does not mutate the input array', () => {
    const input = ['a', 'b', 'c'];
    moveIdToIndex(input, 'a', 2);
    expect(input).toEqual(['a', 'b', 'c']);
  });
});
