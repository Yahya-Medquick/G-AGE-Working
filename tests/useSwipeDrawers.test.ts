import { describe, expect, it } from 'vitest';
import { getSwipeDrawerAction, isIgnoredSwipeTarget } from '../src/hooks/useSwipeDrawers';

describe('drawer swipe gesture logic', () => {
  const mobile = { isLeftOpen: false, isRightOpen: false, viewportWidth: 390 };

  it('requires at least 60px of horizontal movement', () => {
    expect(getSwipeDrawerAction(59, 0, 'stage', mobile)).toBeNull();
    expect(getSwipeDrawerAction(60, 0, 'stage', mobile)).toBe('open-left');
  });

  it('requires horizontal movement to exceed twice the vertical movement', () => {
    expect(getSwipeDrawerAction(100, 50, 'stage', mobile)).toBeNull();
    expect(getSwipeDrawerAction(101, 50, 'stage', mobile)).toBe('open-left');
    expect(getSwipeDrawerAction(10, 100, 'stage', mobile)).toBeNull();
  });

  it('opens the corresponding drawer based on direction', () => {
    expect(getSwipeDrawerAction(80, 0, 'stage', mobile)).toBe('open-left');
    expect(getSwipeDrawerAction(-80, 0, 'stage', mobile)).toBe('open-right');
  });

  it('only closes an open drawer with a swipe on it toward its edge', () => {
    expect(getSwipeDrawerAction(-80, 0, 'left-drawer', { ...mobile, isLeftOpen: true })).toBe('close-left');
    expect(getSwipeDrawerAction(80, 0, 'left-drawer', { ...mobile, isLeftOpen: true })).toBeNull();
    expect(getSwipeDrawerAction(80, 0, 'right-drawer', { ...mobile, isRightOpen: true })).toBe('close-right');
    expect(getSwipeDrawerAction(-80, 0, 'right-drawer', { ...mobile, isRightOpen: true })).toBeNull();
  });

  it('does not handle desktop gestures or gestures outside the stage and drawers', () => {
    expect(getSwipeDrawerAction(80, 0, 'stage', { ...mobile, viewportWidth: 1024 })).toBeNull();
    expect(getSwipeDrawerAction(80, 0, 'other', mobile)).toBeNull();
    expect(getSwipeDrawerAction(80, 0, 'ignored', mobile)).toBeNull();
  });

  it('ignores inputs, contenteditable areas, dialogs, marked controls, and horizontal scrollers', () => {
    const base = {
      tagName: 'div',
      contentEditable: false,
      dataNoSwipe: false,
      insideModal: false,
      horizontallyScrollable: false,
    };

    expect(isIgnoredSwipeTarget({ ...base, tagName: 'textarea' })).toBe(true);
    expect(isIgnoredSwipeTarget({ ...base, tagName: 'INPUT' })).toBe(true);
    expect(isIgnoredSwipeTarget({ ...base, contentEditable: true })).toBe(true);
    expect(isIgnoredSwipeTarget({ ...base, dataNoSwipe: true })).toBe(true);
    expect(isIgnoredSwipeTarget({ ...base, insideModal: true })).toBe(true);
    expect(isIgnoredSwipeTarget({ ...base, horizontallyScrollable: true })).toBe(true);
    expect(isIgnoredSwipeTarget(base)).toBe(false);
  });
});
