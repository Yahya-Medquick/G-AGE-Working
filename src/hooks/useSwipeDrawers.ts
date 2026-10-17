import { useEffect, useRef, type RefObject } from 'react';

export type SwipeDirection = 'left' | 'right';

const MIN_SWIPE_DISTANCE = 60;
const IGNORED_TARGETS = 'input, textarea, select, [contenteditable], [data-no-swipe], [role="dialog"], [aria-modal="true"], [data-modal="open"]';

export function getSwipeDirection(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): SwipeDirection | null {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE || Math.abs(deltaX) <= 2 * Math.abs(deltaY)) {
    return null;
  }
  return deltaX > 0 ? 'right' : 'left';
}

export function shouldIgnoreSwipeTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false;

  const element = target as HTMLElement;
  if (element.closest(IGNORED_TARGETS)) return true;

  let ancestor: HTMLElement | null = element;
  while (ancestor) {
    const overflowX = typeof window !== 'undefined'
      ? window.getComputedStyle(ancestor).overflowX
      : '';
    const hasHorizontalScroll = overflowX === 'auto' || overflowX === 'scroll' ||
      ancestor.classList?.contains('overflow-x-auto') || ancestor.classList?.contains('overflow-x-scroll');
    if (hasHorizontalScroll) return true;
    if (ancestor.classList?.contains('fixed') && ancestor.classList?.contains('inset-0')) return true;
    ancestor = ancestor.parentElement;
  }
  return false;
}

interface SwipeDrawerOptions {
  isLeftOpen: boolean;
  isRightOpen: boolean;
  isTourOpen: boolean;
  onOpenLeft: () => void;
  onCloseLeft: () => void;
  onOpenRight: () => void;
  onCloseRight: () => void;
}

export function useSwipeDrawers(options: SwipeDrawerOptions): RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let start: { x: number; y: number } | null = null;

    const handleTouchStart = (event: TouchEvent) => {
      if (window.innerWidth >= 1024 || !event.touches.length) {
        start = null;
        return;
      }
      if (shouldIgnoreSwipeTarget(event.target)) {
        start = null;
        return;
      }
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const startPoint = start;
      start = null;
      if (!startPoint || window.innerWidth >= 1024 || !event.changedTouches.length) return;

      const touch = event.changedTouches[0];
      const direction = getSwipeDirection(startPoint.x, startPoint.y, touch.clientX, touch.clientY);
      const options = optionsRef.current;
      if (!direction || !options || options.isTourOpen) return;

      if (direction === 'right') {
        if (options.isRightOpen) {
          options.onCloseRight();
        } else if (!options.isLeftOpen) {
          options.onCloseRight();
          options.onOpenLeft();
        }
      } else if (options.isLeftOpen) {
        options.onCloseLeft();
      } else if (!options.isRightOpen) {
        options.onCloseLeft();
        options.onOpenRight();
      }
    };

    const clearStart = () => { start = null; };
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', clearStart, { passive: true });
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', clearStart);
    };
  }, []);

  return containerRef;
}