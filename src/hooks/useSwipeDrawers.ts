import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export type SwipeDrawerAction = 'open-left' | 'open-right' | 'close-left' | 'close-right';
export type SwipeStartRegion = 'stage' | 'left-drawer' | 'right-drawer' | 'other' | 'ignored';

interface SwipeTargetTraits {
  tagName: string;
  contentEditable: boolean;
  dataNoSwipe: boolean;
  insideModal: boolean;
  horizontallyScrollable: boolean;
}

interface SwipeDrawerState {
  isLeftOpen: boolean;
  isRightOpen: boolean;
  viewportWidth: number;
}

export const MIN_SWIPE_DISTANCE = 60;

export function isIgnoredSwipeTarget({
  tagName,
  contentEditable,
  dataNoSwipe,
  insideModal,
  horizontallyScrollable,
}: SwipeTargetTraits): boolean {
  return (
    ['input', 'textarea', 'select'].includes(tagName.toLowerCase()) ||
    contentEditable ||
    dataNoSwipe ||
    insideModal ||
    horizontallyScrollable
  );
}

export function getSwipeDrawerAction(
  dx: number,
  dy: number,
  startRegion: SwipeStartRegion,
  { isLeftOpen, isRightOpen, viewportWidth }: SwipeDrawerState
): SwipeDrawerAction | null {
  if (
    viewportWidth >= 1024 ||
    Math.abs(dx) < MIN_SWIPE_DISTANCE ||
    Math.abs(dx) <= 2 * Math.abs(dy) ||
    startRegion === 'ignored' ||
    startRegion === 'other' ||
    (isLeftOpen && isRightOpen)
  ) {
    return null;
  }

  if (isLeftOpen) {
    return startRegion === 'left-drawer' && dx < 0 ? 'close-left' : null;
  }
  if (isRightOpen) {
    return startRegion === 'right-drawer' && dx > 0 ? 'close-right' : null;
  }
  if (startRegion !== 'stage') return null;

  return dx > 0 ? 'open-left' : 'open-right';
}

function getStartRegion(target: EventTarget | null, root: HTMLElement): SwipeStartRegion {
  if (!(target instanceof Element)) return 'ignored';

  const modalSelector = '[role="dialog"], [aria-modal="true"], [data-modal="open"], .driver-overlay';
  let horizontallyScrollable = false;
  let ancestor: Element | null = target;
  while (ancestor && root.contains(ancestor)) {
    const style = window.getComputedStyle(ancestor);
    if (
      (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
      ancestor.scrollWidth > ancestor.clientWidth + 1
    ) {
      horizontallyScrollable = true;
      break;
    }
    ancestor = ancestor.parentElement;
  }

  const ignored = isIgnoredSwipeTarget({
    tagName: target.tagName,
    contentEditable: target instanceof HTMLElement && target.isContentEditable,
    dataNoSwipe: Boolean(target.closest('[data-no-swipe]')),
    insideModal: Boolean(target.closest(modalSelector)),
    horizontallyScrollable,
  });
  if (ignored) return 'ignored';

  const drawer = target.closest<HTMLElement>('[data-drawer]');
  if (drawer && root.contains(drawer)) {
    const drawerSide = drawer.dataset.drawer;
    if (drawerSide === 'left' || drawerSide === 'right') return `${drawerSide}-drawer`;
  }
  return target.closest('[data-swipe-stage]') ? 'stage' : 'other';
}

interface UseSwipeDrawersOptions extends SwipeDrawerState {
  onOpenLeft: () => void;
  onOpenRight: () => void;
  onCloseLeft: () => void;
  onCloseRight: () => void;
}

export function useSwipeDrawers<T extends HTMLElement>(
  options: UseSwipeDrawersOptions
): RefObject<T | null> {
  const rootRef = useRef<T>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let start: { x: number; y: number; region: SwipeStartRegion } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        start = null;
        return;
      }
      const touch = event.touches[0];
      start = {
        x: touch.clientX,
        y: touch.clientY,
        region: getStartRegion(event.target, root),
      };
    };
    const onTouchEnd = (event: TouchEvent) => {
      const initial = start;
      start = null;
      if (!initial || event.changedTouches.length !== 1) return;

      const touch = event.changedTouches[0];
      const current = optionsRef.current;
      const action = getSwipeDrawerAction(
        touch.clientX - initial.x,
        touch.clientY - initial.y,
        initial.region,
        current
      );

      if (action === 'open-left') current.onOpenLeft();
      if (action === 'open-right') current.onOpenRight();
      if (action === 'close-left') current.onCloseLeft();
      if (action === 'close-right') current.onCloseRight();
    };
    const onTouchCancel = () => {
      start = null;
    };

    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchend', onTouchEnd, { passive: true });
    root.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchend', onTouchEnd);
      root.removeEventListener('touchcancel', onTouchCancel);
    };
  }, []);

  return rootRef;
}
