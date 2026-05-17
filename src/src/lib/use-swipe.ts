'use client';

import { useRef, useCallback, useEffect } from 'react';

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export interface SwipeOptions {
  /** Minimum horizontal distance in px to trigger swipe (default: 50) */
  threshold?: number;
  /** Maximum vertical distance allowed for a horizontal swipe (default: 80) */
  maxVertical?: number;
  /** Callback for swipe right (left → right) */
  onSwipeRight?: () => void;
  /** Callback for swipe left (right → left) */
  onSwipeLeft?: () => void;
  /** Callback for swipe down (top → bottom), e.g. pull-to-refresh */
  onSwipeDown?: () => void;
  /** Minimum distance for vertical swipe (default: 60) */
  verticalThreshold?: number;
}

/**
 * Touch swipe gesture hook.
 * Tracks touch start/move/end and fires callbacks when swipe is detected.
 */
export function useSwipeGesture(options: SwipeOptions): SwipeHandlers {
  const {
    threshold = 50,
    maxVertical = 80,
    verticalThreshold = 60,
    onSwipeRight,
    onSwipeLeft,
    onSwipeDown,
  } = options;

  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const tracking = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
    tracking.current = true;
  }, []);

  const onTouchMove = useCallback((_e: React.TouchEvent) => {
    // We just track; decision is made on touchEnd
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!tracking.current) return;
      tracking.current = false;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;
      const dt = Date.now() - startTime.current;

      // Ignore very slow gestures (> 800ms)
      if (dt > 800) return;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Horizontal swipe
      if (absDx > threshold && absDy < maxVertical) {
        if (dx > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (dx < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
        return;
      }

      // Vertical swipe (swipe down)
      if (absDy > verticalThreshold && absDy > absDx) {
        if (dy > 0 && onSwipeDown) {
          onSwipeDown();
        }
      }
    },
    [threshold, maxVertical, verticalThreshold, onSwipeRight, onSwipeLeft, onSwipeDown]
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
}
