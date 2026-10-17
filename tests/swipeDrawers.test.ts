import { describe, expect, it } from 'vitest';
import { getSwipeDirection, shouldIgnoreSwipeTarget } from '../src/hooks/useSwipeDrawers';

describe('drawer swipe recognition', () => {
  it('requires at least 60px of predominantly horizontal movement', () => {
    expect(getSwipeDirection(100, 100, 159, 100)).toBeNull();
    expect(getSwipeDirection(100, 100, 160, 100)).toBe('right');
    expect(getSwipeDirection(160, 100, 100, 100)).toBe('left');
    expect(getSwipeDirection(100, 100, 200, 151)).toBeNull();
    expect(getSwipeDirection(100, 100, 200, 150)).toBeNull();
  });

  it('ignores form controls and elements marked data-no-swipe', () => {
    const makeTarget = (selector: string) => ({
      closest: (selectors: string) => selectors.includes(selector) ? {} as Element : null,
      parentElement: null,
    }) as unknown as EventTarget;

    expect(shouldIgnoreSwipeTarget(makeTarget('textarea'))).toBe(true);
    expect(shouldIgnoreSwipeTarget(makeTarget('[data-no-swipe]'))).toBe(true);
    expect(shouldIgnoreSwipeTarget(makeTarget('button'))).toBe(false);
  });

  it('ignores horizontally scrollable ancestors', () => {
    const scrollable = {
      closest: () => null,
      parentElement: null,
      scrollWidth: 300,
      clientWidth: 100,
      classList: { contains: (name: string) => name === 'overflow-x-auto' },
    } as unknown as HTMLElement;
    const child = {
      closest: () => null,
      parentElement: scrollable,
      scrollWidth: 20,
      clientWidth: 20,
      classList: { contains: () => false },
    } as unknown as EventTarget;

    expect(shouldIgnoreSwipeTarget(child)).toBe(true);
  });
});